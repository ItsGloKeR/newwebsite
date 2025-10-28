// services/anilistService.ts

import { Anime, RelatedAnime, StaffMember, AiringSchedule, SearchSuggestion, FilterState, RecommendedAnime, AnimeTrailer, NextAiringEpisode, MediaSeason, ZenshinMapping, MediaFormat, MediaStatus, Character, VoiceActor, PageInfo, ConsumetWatchData, HiAnimeInfo } from '../types';
import * as db from './dbService';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

// Cache Durations
const ANIME_DETAILS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (static)
const HOME_PAGE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (dynamic)
const LANDING_PAGE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (static)
const LATEST_EPISODES_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (dynamic)
const AIRING_SCHEDULE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (dynamic)
const GENRE_COLLECTION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (static)
const SEARCH_SUGGESTIONS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (dynamic)
const DISCOVER_ANIME_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for discover to reflect updates
const ZENSHIN_MAPPINGS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (static)
const CONSUMET_STREAM_CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour (stream links can expire)
const HIANIME_MAPPER_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (static)
const FILLER_API_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (static)

// A map to store in-flight promises to prevent race conditions.
const inFlightRequests = new Map<string, Promise<any>>();

const ANILIST_API_URLS = [
  'https://graphql.anilist.co',
  'https://graphql.consumet.org' // A public proxy as a fallback
];

// This will keep track of the last known working API to prioritize it.
let currentApiIndex = 0;

// A module-level flag to control data-saving behavior globally for this service.
let isDataSaver = false;

/**
 * Sets the data saver mode for all subsequent API calls within this service.
 * @param isActive A boolean indicating if data saver mode should be enabled.
 */
export function setDataSaverMode(isActive: boolean) {
    if (isDataSaver !== isActive) {
        console.log(`Data Saver Mode ${isActive ? 'activated' : 'deactivated'}. Fetching lighter data.`);
        isDataSaver = isActive;
    }
}

// Helper to get image quality based on data saver mode
const getImageQuality = () => ({
  cover: isDataSaver ? 'large' : 'extraLarge',
  search: isDataSaver ? 'medium' : 'large',
});

const getSimpleAnimeFieldsFragment = () => `
  id
  idMal
  isAdult
  title {
    romaji
    english
  }
  description(asHtml: false)
  coverImage {
    ${getImageQuality().cover}
    color
  }
  bannerImage
  genres
  episodes
  duration
  status
  format
  seasonYear
  averageScore
  nextAiringEpisode {
    episode
  }
`;

const getSmallCardAnimeFieldsFragment = () => `
  id
  idMal
  isAdult
  title {
    romaji
    english
  }
  description(asHtml: false)
  coverImage {
    ${isDataSaver ? 'medium' : 'large'}
    color
  }
  bannerImage
  genres
  episodes
  duration
  status
  format
  seasonYear
  averageScore
  nextAiringEpisode {
    episode
  }
`;

const getHeroAnimeFieldsFragment = () => getSimpleAnimeFieldsFragment();

const getAnimeFieldsFragment = () => `
  id
  idMal
  isAdult
  title {
    romaji
    english
  }
  description(asHtml: false)
  coverImage {
    ${getImageQuality().cover}
    color
  }
  bannerImage
  genres
  episodes
  duration
  status
  format
  nextAiringEpisode {
    episode
    airingAt
    timeUntilAiring
  }
  seasonYear
  averageScore
  studios(isMain: true) {
    nodes {
      name
    }
  }
  staff(sort: [RELEVANCE, ID], perPage: 15) {
    edges {
      role
      node {
        id
        name {
          full
        }
        image {
          large
        }
      }
    }
  }
  characters(sort: [ROLE, RELEVANCE, ID], perPage: 16) {
    edges {
      role
      node {
        id
        name {
          full
        }
        image {
          large
        }
      }
      voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
        id
        name {
          full
        }
        image {
          large
        }
      }
    }
  }
  relations {
    edges {
      relationType(version: 2)
      node {
        id
        type
        isAdult
        episodes
        format
        seasonYear
        title {
          romaji
          english
        }
        coverImage {
          ${getImageQuality().cover}
        }
      }
    }
  }
  trailer {
    id
    site
  }
  recommendations(sort: RATING_DESC, perPage: ${isDataSaver ? 5 : 10}) {
    nodes {
      mediaRecommendation {
        id
        isAdult
        episodes
        format
        seasonYear
        title {
          romaji
          english
        }
        coverImage {
          ${getImageQuality().cover}
        }
      }
    }
  }
`;

// Helper function to fetch data from AniList with fallback and rate-limiting retry logic.
// This function prioritizes getting fresh data, retrying on rate limits.
// If all retries fail, it throws an error which is caught by `getOrSetCache`.
// `getOrSetCache` will then attempt to serve stale data as a final fallback.
const fetchAniListData = async (query: string, variables: object) => {
  const maxRetriesPerEndpoint = 2;
  let lastError: Error | null = null;

  for (let i = 0; i < ANILIST_API_URLS.length; i++) {
    const endpointIndex = (currentApiIndex + i) % ANILIST_API_URLS.length;
    const endpoint = ANILIST_API_URLS[endpointIndex];
    
    for (let attempt = 0; attempt < maxRetriesPerEndpoint; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ query, variables }),
        });

        if (response.ok) {
          const json = await response.json();
          if (json.errors) {
            lastError = new Error(`GraphQL Error from ${endpoint}: ${json.errors.map((e: any) => e.message).join(', ')}`);
            // GraphQL errors likely won't be fixed by retrying or switching endpoints, but we'll try the next endpoint just in case.
            break; 
          }
          // Success! Prioritize this endpoint for future requests.
          currentApiIndex = endpointIndex;
          return json.data;
        }

        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
          
          // Use exponential backoff with jitter if Retry-After is not provided.
          // Base delay 1s, increasing exponentially. Jitter adds randomness to avoid thundering herd.
          const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          const waitTime = retryAfterSeconds != null ? retryAfterSeconds * 1000 : backoff;

          console.warn(`Rate limited by ${endpoint}. Retrying in ${Math.round(waitTime / 1000)}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          // Continue to retry on this same endpoint.
        } else {
          // For other server errors (e.g., 5xx), break the inner loop and try the next endpoint.
          lastError = new Error(`API error from ${endpoint}: ${response.status} ${response.statusText}`);
          break;
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`Network error fetching from ${endpoint}.`, error);
        // On network error, break the inner loop and try the next endpoint.
        break;
      }
    }
  }

  throw new Error(`Failed to fetch from all AniList API sources. Last error: ${lastError?.message}`);
};

/**
 * A generic wrapper to handle caching logic for API calls using IndexedDB.
 * @param key The cache key.
 * @param maxAgeMs The max age for the cache item.
 * @param fetchFn The function that performs the actual API fetch.
 * @returns The data from cache or API.
 */
async function getOrSetCache<T>(key: string, maxAgeMs: number, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKeyWithMode = `${key}_${isDataSaver ? 'saver' : 'full'}`;

    if (inFlightRequests.has(cacheKeyWithMode)) {
        return inFlightRequests.get(cacheKeyWithMode)!;
    }

    const cachedData = await db.get<T>(cacheKeyWithMode);
    if (cachedData) {
        return cachedData;
    }

    const fetchPromise = (async () => {
        try {
            const freshData = await fetchFn();
            await db.set(cacheKeyWithMode, freshData, maxAgeMs);
            return freshData;
        } catch (error) {
            console.error(`[API Error] Failed to fetch for key: ${key}.`, error);
            const staleData = await db.getStale<T>(cacheKeyWithMode);
            if (staleData) {
                console.warn(`[Cache] Serving STALE data from DB for key: ${key} due to API error.`);
                return staleData;
            }
            throw error;
        } finally {
            inFlightRequests.delete(cacheKeyWithMode);
        }
    })();

    inFlightRequests.set(cacheKeyWithMode, fetchPromise);
    return fetchPromise;
}


// Helper to map API response to our Anime type
const mapToAnime = (data: any): Anime => {
  // Basic sanitation for description
  const description = data.description
    ? data.description.replace(/<br\s*\/?>/gi, '\n').replace(/<i>|<\/i>/g, '')
    : 'No description available.';

  const staff: StaffMember[] = (data.staff?.edges || [])
    .map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name.full,
      role: edge.role,
      image: edge.node.image?.large,
    }));
  
  const characters: Character[] = (data.characters?.edges || []).map((edge: any) => {
    const voiceActorNode = edge.voiceActors?.[0];
    const voiceActor: VoiceActor | undefined = voiceActorNode ? {
        id: voiceActorNode.id,
        name: voiceActorNode.name.full,
        image: voiceActorNode.image?.large || PLACEHOLDER_IMAGE_URL,
    } : undefined;

    return {
        id: edge.node.id,
        name: edge.node.name.full,
        role: edge.role,
        image: edge.node.image?.large || PLACEHOLDER_IMAGE_URL,
        voiceActor,
    };
  });
  
  const relations: RelatedAnime[] = (data.relations?.edges || [])
    .filter((edge: any) => edge.node.type === 'ANIME') // Only include anime relations
    .map((edge: any) => ({
      id: edge.node.id,
      englishTitle: edge.node.title?.english || edge.node.title?.romaji,
      romajiTitle: edge.node.title?.romaji || edge.node.title?.english,
      coverImage: edge.node.coverImage?.[getImageQuality().cover] || PLACEHOLDER_IMAGE_URL,
      relationType: edge.relationType,
      isAdult: edge.node.isAdult,
      episodes: edge.node.episodes,
      format: edge.node.format,
      year: edge.node.seasonYear,
    }));
  
  const recommendations: RecommendedAnime[] = (data.recommendations?.nodes || [])
    .filter((node: any) => node.mediaRecommendation)
    .map((node: any) => ({
      id: node.mediaRecommendation.id,
      englishTitle: node.mediaRecommendation.title?.english || node.mediaRecommendation.title?.romaji,
      romajiTitle: node.mediaRecommendation.title?.romaji || node.mediaRecommendation.title?.english,
      coverImage: node.mediaRecommendation.coverImage?.[getImageQuality().cover] || PLACEHOLDER_IMAGE_URL,
      isAdult: node.mediaRecommendation.isAdult,
      episodes: node.mediaRecommendation.episodes,
      format: node.mediaRecommendation.format,
      year: node.mediaRecommendation.seasonYear,
    }));

  const trailer: AnimeTrailer | undefined = data.trailer && data.trailer.site === 'youtube'
    ? { id: data.trailer.id, site: data.trailer.site }
    : undefined;

  const nextAiringEpisode: NextAiringEpisode | undefined = data.nextAiringEpisode
    ? {
        episode: data.nextAiringEpisode.episode,
        airingAt: data.nextAiringEpisode.airingAt,
        timeUntilAiring: data.nextAiringEpisode.timeUntilAiring,
      }
    : undefined;

  const totalEpisodes = data.episodes;
  let latestReleasedEpisode: number | null;

  switch (data.status) {
    case 'RELEASING':
      latestReleasedEpisode = nextAiringEpisode ? nextAiringEpisode.episode - 1 : null;
      break;
    case 'FINISHED':
      latestReleasedEpisode = totalEpisodes;
      break;
    case 'NOT_YET_RELEASED':
      latestReleasedEpisode = 0;
      break;
    default: // CANCELLED, HIATUS
      latestReleasedEpisode = null;
  }

  return {
    anilistId: data.id,
    malId: data.idMal,
    englishTitle: data.title?.english || data.title?.romaji || "Unknown Title",
    romajiTitle: data.title?.romaji || data.title?.english || "Unknown Title",
    description,
    format: data.format ? data.format.replace(/_/g, ' ') : 'N/A',
    coverImage: data.coverImage?.[getImageQuality().cover] || PLACEHOLDER_IMAGE_URL,
    coverImageColor: data.coverImage?.color,
    bannerImage: data.bannerImage || data.coverImage?.[getImageQuality().cover] || PLACEHOLDER_IMAGE_URL,
    genres: data.genres || [],
    episodes: latestReleasedEpisode,
    totalEpisodes: totalEpisodes || null,
    duration: data.duration,
    year: data.seasonYear || 0,
    rating: data.averageScore || 0,
    status: data.status || 'N/A',
    studios: data.studios?.nodes.map((n: any) => n.name) || [],
    staff,
    characters,
    relations,
    trailer,
    recommendations,
    nextAiringEpisode,
    isAdult: data.isAdult ?? false,
  };
};

// Maps lightweight data for cards, improving performance
const mapToSimpleAnime = (data: any): Anime => {
  const totalEpisodes = data.episodes;
  let latestReleasedEpisode: number | null;

  switch (data.status) {
    case 'RELEASING':
      latestReleasedEpisode = data.nextAiringEpisode ? data.nextAiringEpisode.episode - 1 : null;
      break;
    case 'FINISHED':
      latestReleasedEpisode = totalEpisodes;
      break;
    case 'NOT_YET_RELEASED':
      latestReleasedEpisode = 0;
      break;
    default: // CANCELLED, HIATUS
      latestReleasedEpisode = null;
  }

  return {
    anilistId: data.id,
    malId: data.idMal,
    englishTitle: data.title?.english || data.title?.romaji || 'Unknown Title',
    romajiTitle: data.title?.romaji || data.title?.english || 'Unknown Title',
    coverImage: data.coverImage?.[getImageQuality().cover] || data.coverImage?.large || data.coverImage?.medium || PLACEHOLDER_IMAGE_URL,
    isAdult: data.isAdult ?? false,
    description: data.description ? data.description.replace(/<br\s*\/?>/gi, '\n').replace(/<i>|<\/i>/g, '') : '',
    bannerImage: data.bannerImage || data.coverImage?.[getImageQuality().cover] || data.coverImage?.large || PLACEHOLDER_IMAGE_URL,
    genres: data.genres || [],
    episodes: latestReleasedEpisode,
    totalEpisodes: totalEpisodes || null,
    duration: data.duration || null,
    year: data.seasonYear || 0,
    rating: data.averageScore || 0,
    status: data.status || 'N/A',
    format: data.format ? data.format.replace(/_/g, ' ') : 'N/A',
    studios: [], // Not fetched
    staff: [], // Not fetched
    characters: [], // Not fetched
    relations: [], // Not fetched
    recommendations: [], // Not fetched
  };
};


export const getRandomAnime = async (): Promise<Anime | null> => {
    // Fetch the last page number to determine the range of pages
    const pageInfoQuery = `
        query {
            Page(page: 1, perPage: 1) {
                pageInfo {
                    lastPage
                }
                # We must include the media query to get the correct context for pageInfo
                media(type: ANIME, format_not_in: [MUSIC], isAdult: false, averageScore_greater: 60, sort: POPULARITY_DESC) {
                    id # Select at least one field
                }
            }
        }
    `;
    const pageInfoData = await fetchAniListData(pageInfoQuery, {});
    if (!pageInfoData.Page || !pageInfoData.Page.pageInfo) {
        console.error("Could not fetch page info for random anime.");
        return null;
    }
    const lastPage = pageInfoData.Page.pageInfo.lastPage;
    
    // Pick a random page
    const randomPage = Math.floor(Math.random() * lastPage) + 1;
    
    // Fetch one anime from that random page
    const randomAnimeQuery = `
        query ($page: Int) {
            Page(page: $page, perPage: 1) {
                media(type: ANIME, format_not_in: [MUSIC], isAdult: false, averageScore_greater: 60, sort: POPULARITY_DESC, genre_not_in: "Hentai") {
                    ...animeFields
                }
            }
        }
        fragment animeFields on Media {
            ${getAnimeFieldsFragment()}
        }
    `;
    
    const randomAnimeData = await fetchAniListData(randomAnimeQuery, { page: randomPage });
    
    if (randomAnimeData.Page && randomAnimeData.Page.media && randomAnimeData.Page.media.length > 0) {
        const animeData = randomAnimeData.Page.media[0];
        const anime = mapToAnime(animeData);

        // Manually cache the result so getAnimeDetails on the next page is instant
        const cacheKey = `anime_details_${anime.anilistId}`;
        await db.set(cacheKey, anime, ANIME_DETAILS_CACHE_DURATION);

        return anime;
    }

    return null;
}

const getCurrentSeason = (): { season: MediaSeason, year: number } => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();

    if (month >= 0 && month <= 2) return { season: MediaSeason.WINTER, year };
    if (month >= 3 && month <= 5) return { season: MediaSeason.SPRING, year };
    if (month >= 6 && month <= 8) return { season: MediaSeason.SUMMER, year };
    // month >= 9 && month <= 11
    return { season: MediaSeason.FALL, year };
};


export const getLandingPageData = async () => {
    const cacheKey = 'landingPageData';
    return getOrSetCache(cacheKey, LANDING_PAGE_CACHE_DURATION, async () => {
        const query = `
            query {
                popular: Page(page: 1, perPage: 8) {
                    media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, status_in: [RELEASING, FINISHED], genre_not_in: "Hentai") {
                        id
                        isAdult
                        episodes
                        title {
                            romaji
                            english
                        }
                        coverImage {
                            ${getImageQuality().cover}
                        }
                    }
                }
            }
        `;

        const data = await fetchAniListData(query, {});
        return {
            popular: data.popular.media.map(mapToSimpleAnime),
        };
    });
};


export const getHomePageData = async () => {
    const cacheKey = 'homePageData';
    return getOrSetCache(cacheKey, HOME_PAGE_CACHE_DURATION, async () => {
        const { season, year } = getCurrentSeason();
        
        const query = `
            query ($season: MediaSeason, $seasonYear: Int) {
            trending: Page(page: 1, perPage: ${isDataSaver ? 6 : 10}) {
                media(sort: TRENDING_DESC, type: ANIME, status_in: [RELEASING, FINISHED], genre_not_in: "Hentai", isAdult: false) {
                    ...heroFields
                }
            }
            popular: Page(page: 1, perPage: ${isDataSaver ? 12 : 18}) {
                 media(sort: POPULARITY_DESC, type: ANIME, status_in: [RELEASING, FINISHED], genre_not_in: "Hentai", isAdult: false) {
                    ...simpleFields
                }
            }
            topAiring: Page(page: 1, perPage: 10) {
                 media(sort: POPULARITY_DESC, type: ANIME, status: RELEASING, genre_not_in: "Hentai", isAdult: false) {
                    ...smallCardFields
                }
            }
            topRated: Page(page: 1, perPage: 10) {
                media(sort: SCORE_DESC, type: ANIME, status_in: [RELEASING, FINISHED], genre_not_in: "Hentai", isAdult: false) {
                    ...smallCardFields
                }
            }
            topUpcoming: Page(page: 1, perPage: ${isDataSaver ? 12 : 18}) {
                media(sort: POPULARITY_DESC, type: ANIME, status: NOT_YET_RELEASED, genre_not_in: "Hentai", isAdult: false) {
                    ...simpleFields
                }
            }
            popularThisSeason: Page(page: 1, perPage: ${isDataSaver ? 12 : 18}) {
                media(sort: POPULARITY_DESC, type: ANIME, season: $season, seasonYear: $seasonYear, genre_not_in: "Hentai", isAdult: false) {
                    ...simpleFields
                }
            }
        }
        fragment heroFields on Media {
            ${getHeroAnimeFieldsFragment()}
        }
        fragment simpleFields on Media {
            ${getSimpleAnimeFieldsFragment()}
        }
        fragment smallCardFields on Media {
            ${getSmallCardAnimeFieldsFragment()}
        }
    `;

        const data = await fetchAniListData(query, { season, seasonYear: year });
        
        return {
            trending: data.trending.media.map(mapToSimpleAnime),
            popular: data.popular.media.map(mapToSimpleAnime),
            topAiring: data.topAiring.media.map(mapToSimpleAnime),
            topRated: data.topRated.media.map(mapToSimpleAnime),
            topUpcoming: data.topUpcoming.media.map(mapToSimpleAnime),
            popularThisSeason: data.popularThisSeason.media.map(mapToSimpleAnime),
            currentSeason: season,
            currentYear: year,
        };
    });
};

export const getAnimeDetails = async (id: number): Promise<Anime> => {
    const cacheKey = `anime_details_${id}`;
    return getOrSetCache(cacheKey, ANIME_DETAILS_CACHE_DURATION, async () => {
        const query = `
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    ...animeFields
                }
            }
            fragment animeFields on Media {
                ${getAnimeFieldsFragment()}
            }
        `;
        const data = await fetchAniListData(query, { id });
        return mapToAnime(data.Media);
    });
};

export const getHiAnimeInfo = async (anilistId: number): Promise<HiAnimeInfo | null> => {
    const cacheKey = `hianime_info_v1_${anilistId}`;
    return getOrSetCache(cacheKey, HIANIME_MAPPER_CACHE_DURATION, async () => {
        try {
            const response = await fetch(`https://cors-anywhere-6mov.onrender.com/hianime-mapper-1.onrender.com/anime/info/${anilistId}`);
            if (!response.ok) {
                console.warn(`[HiAnime Mapper] Failed to fetch info for ${anilistId}: ${response.statusText}`);
                return null;
            }
            const data = await response.json();
            return data.data as HiAnimeInfo;
        } catch (error) {
            console.error(`[HiAnime Mapper] Error fetching info for ${anilistId}`, error);
            return null;
        }
    });
};

export const getZenshinMappings = async (anilistId: number): Promise<ZenshinMapping | null> => {
    const cacheKey = `combined_mappings_v2_${anilistId}`; // New key to avoid cache conflicts
    return getOrSetCache(cacheKey, ZENSHIN_MAPPINGS_CACHE_DURATION, async () => {
        try {
            // Fetch mappings and episode info in parallel
            const [mappingsResponse, episodesResponse] = await Promise.all([
                fetch(`https://corsproxy.io/?https://api.anify.tv/mappings?id=${anilistId}&type=anime`).catch(e => { console.warn(`[Mapping Service] Anify API failed for ${anilistId}`, e); return null; }),
                fetch(`https://consumet-seven-navy.vercel.app/meta/anilist/info/${anilistId}`).catch(e => { console.warn(`[Mapping Service] Consumet API failed for ${anilistId}`, e); return null; })
            ]);

            if (!mappingsResponse?.ok && !episodesResponse?.ok) {
                console.warn(`[Mapping Service] Both mapping and episode APIs failed for anilistId: ${anilistId}`);
                return null;
            }

            const finalMapping: ZenshinMapping = {
                mappings: {},
                episodes: {}
            };

            // Process mappings from Anify
            if (mappingsResponse?.ok) {
                const mappingsData = await mappingsResponse.json();
                finalMapping.mappings = {
                    imdb_id: mappingsData.imdbId,
                    mal_id: mappingsData.malId,
                };
            }

            // Process episode details from Consumet
            if (episodesResponse?.ok) {
                const episodesData = await episodesResponse.json();
                if (episodesData.episodes && Array.isArray(episodesData.episodes)) {
                    for (const ep of episodesData.episodes) {
                        if (ep.number) {
                            finalMapping.episodes[String(ep.number)] = {
                                title: {
                                    en: ep.title,
                                },
                                overview: ep.description,
                                id: ep.id,
                                isFiller: ep.isFiller,
                            };
                        }
                    }
                }
            }

            // Return null only if both APIs failed to provide any useful data.
            if (Object.keys(finalMapping.mappings).length === 0 && Object.keys(finalMapping.episodes).length === 0) {
                return null;
            }

            return finalMapping;

        } catch (error) {
            console.error(`[Mapping Service] Error fetching combined mapping for ${anilistId}`, error);
            return null;
        }
    });
};

export const fetchConsumetStream = async (episodeId: string): Promise<ConsumetWatchData | null> => {
    const cacheKey = `consumet_stream_${episodeId}`;
    return getOrSetCache(cacheKey, CONSUMET_STREAM_CACHE_DURATION, async () => {
        try {
            const response = await fetch(`https://consumet-seven-navy.vercel.app/meta/anilist/watch/${episodeId}`);
            if (!response.ok) {
                console.warn(`[Consumet Service] Failed to fetch stream for episodeId ${episodeId}: ${response.statusText}`);
                return null;
            }
            const data = await response.json();
            return data as ConsumetWatchData;
        } catch (error) {
            console.error(`[Consumet Service] Error fetching stream for ${episodeId}`, error);
            return null;
        }
    });
};

export const getGenreCollection = async (): Promise<string[]> => {
    const cacheKey = 'genreCollection';
    return getOrSetCache(cacheKey, GENRE_COLLECTION_CACHE_DURATION, async () => {
        const query = `
            query {
                GenreCollection
            }
        `;
        const data = await fetchAniListData(query, {});
        return data.GenreCollection.filter((genre: string | null) => genre); // Filter out nulls if any
    });
};

export const getSearchSuggestions = async (search: string): Promise<SearchSuggestion[]> => {
    const cacheKey = `search_suggestions_${search}`;
    // A shorter cache duration for suggestions as they are very dynamic.
    return getOrSetCache(cacheKey, SEARCH_SUGGESTIONS_CACHE_DURATION, async () => {
        const query = `
            query ($search: String) {
                Page(page: 1, perPage: 8) {
                    media(search: $search, type: ANIME, sort: POPULARITY_DESC, genre_not_in: "Hentai") {
                        id
                        isAdult
                        episodes
                        title {
                            romaji
                            english
                        }
                        coverImage {
                            ${getImageQuality().search}
                        }
                        seasonYear
                    }
                }
            }
        `;
        const data = await fetchAniListData(query, { search });
        return data.Page.media.map((item: any) => ({
            anilistId: item.id,
            englishTitle: item.title.english || item.title.romaji,
            romajiTitle: item.title.romaji || item.title.english,
            coverImage: item.coverImage[getImageQuality().search] || PLACEHOLDER_IMAGE_URL,
            year: item.seasonYear,
            isAdult: item.isAdult,
            episodes: item.episodes,
        }));
    });
};

export const discoverAnime = async (filters: FilterState): Promise<{ results: Anime[], pageInfo: PageInfo }> => {
    const { search, genres, year, season, formats, statuses, sort, page } = filters;
    const cacheKey = `discover_${JSON.stringify(filters)}`;

    return getOrSetCache(cacheKey, DISCOVER_ANIME_CACHE_DURATION, async () => {
        const variables: any = {
            page,
            perPage: 28,
            sort: [sort],
            type: 'ANIME',
            genre_not_in: "Hentai"
        };
        if (search) variables.search = search;
        if (genres.length > 0) variables.genre_in = genres;
        if (year) variables.seasonYear = parseInt(year, 10);
        if (season) variables.season = season;
        if (formats.length > 0) variables.format_in = formats;
        if (statuses.length > 0) variables.status_in = statuses;

        const query = `
            query (
                $page: Int, 
                $perPage: Int, 
                $search: String, 
                $sort: [MediaSort], 
                $genre_in: [String],
                $seasonYear: Int,
                $season: MediaSeason,
                $format_in: [MediaFormat],
                $status_in: [MediaStatus],
                $genre_not_in: [String],
                $type: MediaType
            ) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        perPage
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    media(
                        search: $search, 
                        sort: $sort, 
                        type: $type, 
                        genre_in: $genre_in, 
                        seasonYear: $seasonYear, 
                        season: $season, 
                        format_in: $format_in,
                        status_in: $status_in,
                        genre_not_in: $genre_not_in,
                        isAdult: false
                    ) {
                        ...animeFields
                    }
                }
            }
            fragment animeFields on Media {
                ${getSimpleAnimeFieldsFragment()}
            }
        `;
        
        const data = await fetchAniListData(query, variables);
        return {
            results: data.Page.media.map(mapToSimpleAnime),
            pageInfo: data.Page.pageInfo,
        };
    });
};

export const getLatestEpisodes = async (): Promise<AiringSchedule[]> => {
    const cacheKey = 'latestEpisodes';
    return getOrSetCache(cacheKey, LATEST_EPISODES_CACHE_DURATION, async () => {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const twoDaysAgo = nowInSeconds - (48 * 60 * 60);

        const query = `
            query ($airingAt_greater: Int, $airingAt_lesser: Int) {
                Page(page: 1, perPage: 30) {
                    airingSchedules(airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME_DESC) {
                        id
                        episode
                        airingAt
                        media {
                            id
                            isAdult
                            episodes
                            genres
                            title {
                                romaji
                                english
                            }
                            coverImage {
                                large
                                medium
                            }
                        }
                    }
                }
            }
        `;
        const data = await fetchAniListData(query, { airingAt_greater: twoDaysAgo, airingAt_lesser: nowInSeconds });
        return data.Page.airingSchedules;
    });
};

export const getMultipleAnimeDetails = async (ids: number[]): Promise<Anime[]> => {
    if (ids.length === 0) return [];
    
    // Sort IDs to create a consistent cache key
    const sortedIds = [...ids].sort((a, b) => a - b);
    const cacheKey = `multi_details_${sortedIds.join(',')}`;

    // Note: We don't cache this as aggressively because user lists can change. 
    // A shorter cache time is reasonable. Or we could manage cache invalidation.
    // For now, let's use a dynamic cache duration.
    return getOrSetCache(cacheKey, DISCOVER_ANIME_CACHE_DURATION, async () => {
        const query = `
            query ($ids: [Int]) {
                Page(page: 1, perPage: ${ids.length}) {
                    media(id_in: $ids, type: ANIME, sort: POPULARITY_DESC) {
                        ...animeFields
                    }
                }
            }
            fragment animeFields on Media {
                ${getSimpleAnimeFieldsFragment()}
            }
        `;
        const data = await fetchAniListData(query, { ids: sortedIds });
        return data.Page.media.map(mapToSimpleAnime);
    });
};

export const getAiringSchedule = async (): Promise<AiringSchedule[]> => {
    const cacheKey = 'airingSchedule';
    return getOrSetCache(cacheKey, AIRING_SCHEDULE_CACHE_DURATION, async () => {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + 7);
        endOfWeek.setHours(23, 59, 59, 999);

        const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
        const endTimestamp = Math.floor(endOfWeek.getTime() / 1000);

        const query = `
            query ($airingAt_greater: Int, $airingAt_lesser: Int) {
                Page(page: 1, perPage: 50) { # Fetch enough for a week
                    airingSchedules(notYetAired: true, airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME) {
                        id
                        episode
                        airingAt
                        media {
                            id
                            isAdult
                            episodes
                            genres
                            title {
                                romaji
                                english
                            }
                            coverImage {
                                extraLarge
                            }
                        }
                    }
                }
            }
        `;

        const data = await fetchAniListData(query, { airingAt_greater: startTimestamp, airingAt_lesser: endTimestamp });
        return data.Page.airingSchedules;
    });
};

export const getFillerEpisodes = async (animeName: string): Promise<number[]> => {
    // Sanitize name for API: lowercase, spaces to hyphens, remove special characters except hyphen
    const sanitizedName = animeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!sanitizedName) return [];

    const cacheKey = `filler_episodes_${sanitizedName}`;
    
    return getOrSetCache(cacheKey, FILLER_API_CACHE_DURATION, async () => {
        try {
            const response = await fetch(`https://anime-filler-episodes-api-i02m.onrender.com/${sanitizedName}`);
            if (!response.ok) {
                if (response.status !== 404) {
                    console.warn(`[Filler API] Failed to fetch filler episodes for "${sanitizedName}": ${response.statusText}`);
                }
                return [];
            }
            const data = await response.json();
            
            if (data.fillerEpisodes && data.fillerEpisodes.length > 0 && typeof data.fillerEpisodes[0] === 'string') {
                const episodeString = data.fillerEpisodes[0];
                const episodes = episodeString.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                return episodes;
            }
            return [];
        } catch (error) {
            console.error(`[Filler API] Error fetching filler episodes for "${sanitizedName}"`, error);
            return [];
        }
    });
};
