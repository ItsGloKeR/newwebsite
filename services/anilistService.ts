// services/anilistService.ts

import { Anime, RelatedAnime, StaffMember, AiringSchedule, SearchSuggestion, FilterState, RecommendedAnime, AnimeTrailer, NextAiringEpisode, MediaSeason, ZenshinMapping, MediaFormat, MediaStatus, Character, VoiceActor, PageInfo } from '../types';
import * as db from './dbService';
// FIX: Import PLACEHOLDER_IMAGE_URL for robust object mapping.
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
    const cachedData = await db.get<T>(cacheKeyWithMode);
    if (cachedData) {
        return cachedData;
    }

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
    }
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
    // FIX: Add optional chaining and fallback for voice actor image to prevent runtime errors.
    const voiceActor: VoiceActor | undefined = voiceActorNode ? {
        id: voiceActorNode.id,
        name: voiceActorNode.name.full,
        image: voiceActorNode.image?.large || PLACEHOLDER_IMAGE_URL,
    } : undefined;

    return {
        id: edge.node.id,
        name: edge.node.name.full,
        role: edge.role,
        // FIX: Add optional chaining and fallback for character image to prevent runtime errors.
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

  let releasedEpisodes = data.episodes;
  if (data.status === 'RELEASING' && data.nextAiringEpisode) {
    // If it's airing, the number of released episodes is one less than the next to air.
    releasedEpisodes = data.nextAiringEpisode.episode - 1;
  }
  // The anilist API sometimes returns null for episodes, so we need to handle that.
  if (releasedEpisodes === null && data.nextAiringEpisode) {
      releasedEpisodes = data.nextAiringEpisode.episode - 1;
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
    episodes: releasedEpisodes || 0,
    totalEpisodes: data.episodes || null,
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

// FIX: Made mapToSimpleAnime more robust to prevent type errors.
// It now safely handles potentially null data from the API and correctly maps seasonYear.
const mapToSimpleAnime = (data: any): Anime => ({
    anilistId: data.id,
    englishTitle: data.title?.english || data.title?.romaji || 'Unknown Title',
    romajiTitle: data.title?.romaji || data.title?.english || 'Unknown Title',
    coverImage: data.coverImage?.[getImageQuality().cover] || PLACEHOLDER_IMAGE_URL,
    isAdult: data.isAdult ?? false,
    // Add default values for other required Anime fields
    description: '',
    bannerImage: data.bannerImage || data.coverImage?.[getImageQuality().cover] || PLACEHOLDER_IMAGE_URL,
    genres: [],
    episodes: data.episodes || 0,
    totalEpisodes: data.episodes || null,
    duration: null,
    year: data.seasonYear || 0,
    rating: 0,
    status: '',
    format: '',
    studios: [],
    staff: [],
    characters: [],
    relations: [],
    recommendations: [],
});

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
        return mapToAnime(randomAnimeData.Page.media[0]);
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
                ...animeFields
                }
            }
            popular: Page(page: 1, perPage: ${isDataSaver ? 12 : 24}) {
                media(sort: POPULARITY_DESC, type: ANIME, status_in: [RELEASING, FINISHED], genre_not_in: "Hentai", isAdult: false) {
                ...animeFields
                }
            }
            topAiring: Page(page: 1, perPage: ${isDataSaver ? 5 : 10}) {
                media(sort: POPULARITY_DESC, type: ANIME, status: RELEASING, genre_not_in: "Hentai", isAdult: false) {
                ...animeFields
                }
            }
            topRated: Page(page: 1, perPage: ${isDataSaver ? 5 : 10}) {
                media(sort: SCORE_DESC, type: ANIME, genre_not_in: "Hentai", isAdult: false) {
                ...animeFields
                }
            }
            topUpcoming: Page(page: 1, perPage: ${isDataSaver ? 6 : 10}) {
                media(sort: POPULARITY_DESC, type: ANIME, status: NOT_YET_RELEASED, genre_not_in: "Hentai", isAdult: false) {
                ...animeFields
                }
            }
            popularThisSeason: Page(page: 1, perPage: ${isDataSaver ? 6 : 10}) {
                media(sort: POPULARITY_DESC, type: ANIME, season: $season, seasonYear: $seasonYear, genre_not_in: "Hentai", isAdult: false) {
                    ...animeFields
                }
            }
            }

            fragment animeFields on Media {
            ${getAnimeFieldsFragment()}
            }
        `;

        const data = await fetchAniListData(query, { season, seasonYear: year });
        
        return {
            trending: data.trending.media.map(mapToAnime),
            popular: data.popular.media.map(mapToAnime),
            topAiring: data.topAiring.media.map(mapToAnime),
            topRated: data.topRated.media.map(mapToAnime),
            topUpcoming: data.topUpcoming.media.map(mapToAnime),
            popularThisSeason: data.popularThisSeason.media.map(mapToAnime),
            currentSeason: season,
            currentYear: year,
        };
    });
};

export const getMultipleAnimeDetails = async (ids: number[]): Promise<Anime[]> => {
    if (ids.length === 0) {
        return [];
    }
    
    const dbPromises = ids.map(id => db.get<Anime>(`anime_details_${id}`));
    const cachedAnimeResults = await Promise.all(dbPromises);
    const cachedAnime = cachedAnimeResults.filter((a): a is Anime => a !== null);

    const cachedIds = new Set(cachedAnime.map(a => a.anilistId));
    const idsToFetch = ids.filter(id => !cachedIds.has(id));
    
    if (idsToFetch.length === 0) {
        const animeMap = new Map(cachedAnime.map(a => [a.anilistId, a]));
        return ids.map(id => animeMap.get(id)).filter((a): a is Anime => a !== undefined);
    }
    
    let fetchedAnime: Anime[] = [];
    try {
        const query = `
            query ($ids: [Int]) {
                Page(page: 1, perPage: 50) {
                    media(id_in: $ids, type: ANIME) {
                        ...animeFields
                    }
                }
            }
            fragment animeFields on Media {
                ${getAnimeFieldsFragment()}
            }
        `;
        const variables = { ids: idsToFetch };
        const data = await fetchAniListData(query, variables);
        fetchedAnime = data.Page.media.map(mapToAnime);

        const setPromises = fetchedAnime.map(anime => {
            const cacheKey = `anime_details_${anime.anilistId}`;
            return db.set(cacheKey, anime, ANIME_DETAILS_CACHE_DURATION);
        });
        await Promise.all(setPromises);
    } catch (error) {
        console.error(`Failed to fetch multiple anime details for IDs: ${idsToFetch}`, error);
        const stalePromises = idsToFetch.map(id => db.getStale<Anime>(`anime_details_${id}`));
        const staleFetchedAnimeResults = await Promise.all(stalePromises);
        const staleFetchedAnime = staleFetchedAnimeResults.filter((a): a is Anime => a !== null);
        fetchedAnime.push(...staleFetchedAnime);
    }
    
    const allAnime = [...cachedAnime, ...fetchedAnime];
    const animeMap = new Map(allAnime.map(a => [a.anilistId, a]));
    return ids.map(id => animeMap.get(id)).filter((a): a is Anime => a !== undefined);
};

export const getLatestEpisodes = async (): Promise<AiringSchedule[]> => {
    const cacheKey = 'latestEpisodes';
    return getOrSetCache(cacheKey, LATEST_EPISODES_CACHE_DURATION, async () => {
        const query = `
        query {
            Page(page: 1, perPage: ${isDataSaver ? 15 : 25}) {
            airingSchedules(notYetAired: false, sort: TIME_DESC) {
                id
                episode
                airingAt
                media {
                id
                isAdult
                episodes
                genres
                format
                seasonYear
                description(asHtml: false)
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
        }
        `;

        const data = await fetchAniListData(query, {});
        const schedules: AiringSchedule[] = data.Page.airingSchedules.filter(
            (schedule: any) => 
                schedule.media.genres && 
                !schedule.media.genres.includes('Hentai') && 
                !schedule.media.isAdult
        );

        const uniqueSchedules = schedules.reduce((acc, current) => {
            if (!acc.some(item => item.media.id === current.media.id)) {
                acc.push(current);
            }
            return acc;
        }, [] as AiringSchedule[]);
        
        return uniqueSchedules.slice(0, isDataSaver ? 10 : 18);
    });
};


export const discoverAnime = async (filters: FilterState): Promise<{ results: Anime[], pageInfo: PageInfo | null }> => {
  const cacheKey = `discover_${JSON.stringify(filters)}`;
  return getOrSetCache(cacheKey, DISCOVER_ANIME_CACHE_DURATION, async () => {
    const perPage = 28; // Divisible by common grid columns (2, 4, 7)
    const query = `
      query (
        $search: String,
        $page: Int,
        $perPage: Int,
        $sort: [MediaSort],
        $genres: [String],
        $season: MediaSeason,
        $seasonYear: Int,
        $format_in: [MediaFormat],
        $status_in: [MediaStatus],
        $genre_not_in: [String],
        $isAdult: Boolean,
        $averageScore_greater: Int,
        $averageScore_lesser: Int
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
            type: ANIME,
            sort: $sort,
            genre_in: $genres,
            season: $season,
            seasonYear: $seasonYear,
            format_in: $format_in,
            status_in: $status_in,
            genre_not_in: $genre_not_in,
            isAdult: $isAdult,
            averageScore_greater: $averageScore_greater,
            averageScore_lesser: $averageScore_lesser
          ) {
            ...animeFields
          }
        }
      }
      fragment animeFields on Media {
        ${getAnimeFieldsFragment()}
      }
    `;

    const buildVariables = () => {
      const variables: any = {
        search: filters.search.trim() ? filters.search.trim() : undefined,
        sort: [filters.sort],
        page: filters.page,
        perPage,
      };

      if (!filters.search.trim()) {
        variables.isAdult = false;
        variables.genre_not_in = ['Hentai'];
      }

      if (filters.genres.length > 0) variables.genres = filters.genres;
      if (filters.year && !isNaN(parseInt(filters.year))) variables.seasonYear = parseInt(filters.year, 10);
      if (filters.season) variables.season = filters.season;
      if (filters.formats.length > 0) variables.format_in = filters.formats;
      if (filters.statuses.length > 0) variables.status_in = filters.statuses;

      if (filters.scoreRange) {
        if (filters.scoreRange[0] > 0) variables.averageScore_greater = filters.scoreRange[0];
        if (filters.scoreRange[1] < 100) variables.averageScore_lesser = filters.scoreRange[1];
      }
      
      return variables;
    }
    
    try {
      const data = await fetchAniListData(query, buildVariables());
      const allMedia = (data.Page && data.Page.media) ? data.Page.media.filter(Boolean) : [];
      // FIX: Use mapToAnime to correctly map the full data set from getAnimeFieldsFragment.
      const mappedAnime = allMedia.map(mapToAnime);
      const uniqueAnime = Array.from(new Map(mappedAnime.map(anime => [anime.anilistId, anime])).values());
      
      return {
          results: uniqueAnime,
          pageInfo: data.Page.pageInfo || null,
      };
    } catch (error) {
      console.error(`Failed to fetch discovery page:`, error);
      const emptyResults: Anime[] = [];
      return { results: emptyResults, pageInfo: null };
    }
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
        const variables = { id };
        const data = await fetchAniListData(query, variables);
        return mapToAnime(data.Media);
    });
};

export const getAiringSchedule = async (): Promise<AiringSchedule[]> => {
    const cacheKey = 'airingSchedule';
    return getOrSetCache(cacheKey, AIRING_SCHEDULE_CACHE_DURATION, async () => {
        const query = `
        query ($airingAt_greater: Int, $airingAt_lesser: Int, $page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
            pageInfo {
                hasNextPage
            }
            airingSchedules(airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME) {
                id
                episode
                airingAt
                media {
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
        }
        `;
        
        const now = Math.floor(Date.now() / 1000);
        // Get schedule for the next 30 days
        const thirtyDaysLater = now + 30 * 24 * 60 * 60;
        
        let allSchedules: AiringSchedule[] = [];
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            const variables = {
                airingAt_greater: now,
                airingAt_lesser: thirtyDaysLater,
                page: page,
                perPage: 50
            };
            const data = await fetchAniListData(query, variables);
            
            if (data.Page && data.Page.airingSchedules) {
                allSchedules = allSchedules.concat(data.Page.airingSchedules);
                hasNextPage = data.Page.pageInfo.hasNextPage;
                page++;
            } else {
                hasNextPage = false;
            }
        }
        
        return allSchedules;
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
        return data.GenreCollection.filter((genre: string | null) => genre !== null);
    });
};

// A more lightweight search for suggestions dropdown
export const getSearchSuggestions = async (searchTerm: string): Promise<SearchSuggestion[]> => {
  if (!searchTerm) return [];
  
  const cacheKey = `search_suggestions_${searchTerm.toLowerCase().trim()}`;
  return getOrSetCache(cacheKey, SEARCH_SUGGESTIONS_CACHE_DURATION, async () => {
    const query = `
      query ($search: String) {
        Page(page: 1, perPage: 8) {
          media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
            id
            isAdult
            episodes
            title {
              romaji
              english
            }
            coverImage {
              medium
            }
            seasonYear
          }
        }
      }
    `;

    const variables = { search: searchTerm };
    const data = await fetchAniListData(query, variables);

    return data.Page.media.map((media: any) => ({
      anilistId: media.id,
      englishTitle: media.title.english || media.title.romaji,
      romajiTitle: media.title.romaji || media.title.english,
      coverImage: media.coverImage.medium,
      year: media.seasonYear,
      isAdult: media.isAdult,
      episodes: media.episodes,
    }));
  });
};

// Zenshin API for detailed episode mappings
const ZENSHIN_API_BASE_URLS = [
  'https://zenshin-supabase-api.onrender.com',
  'https://zenshin-supabase-api-myig.onrender.com',
];

async function fetchFromZenshin(endpoint: string): Promise<Response> {
  let error: any;
  for (const baseUrl of ZENSHIN_API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}/${endpoint}`);
      if (response.ok || response.status === 404) {
        return response;
      }
      error = new Error(`Request failed with status ${response.status} from ${baseUrl}`);
    } catch (e) {
      error = e;
      console.warn(`Failed to fetch from ${baseUrl}. Trying next fallback.`, e);
    }
  }
  throw error || new Error('All Zenshin API requests failed.');
}

export const getZenshinMappings = async (anilistId: number): Promise<ZenshinMapping | null> => {
    const cacheKey = `zenshin_${anilistId}`;
    return getOrSetCache(cacheKey, ZENSHIN_MAPPINGS_CACHE_DURATION, async () => {
        try {
            const response = await fetchFromZenshin(`mappings?anilist_id=${anilistId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`No Zenshin mapping found for anilistId: ${anilistId}`);
                    return null;
                }
                throw new Error(`Failed to fetch Zenshin mappings. Status: ${response.status}`);
            }
            const data = await response.json();
            if (data && data.mappings && data.mappings.mal_id) {
                const animeDetails = await getAnimeDetails(anilistId);
                if (!animeDetails.malId) {
                    data.malId = data.mappings.mal_id;
                }
            }
            return data as ZenshinMapping;
        } catch (error) {
            console.error(`Error fetching Zenshin mappings for anilistId ${anilistId}:`, error);
            return null;
        }
    });
};
