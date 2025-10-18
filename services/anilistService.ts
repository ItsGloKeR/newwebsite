import { Anime, RelatedAnime, StaffMember, AiringSchedule, SearchSuggestion, FilterState, RecommendedAnime } from '../types';

const ANILIST_API_URL = 'https://graphql.anilist.co';

const ANIME_FIELDS_FRAGMENT = `
  id
  title {
    romaji
    english
  }
  description(asHtml: false)
  coverImage {
    extraLarge
    color
  }
  bannerImage
  genres
  episodes
  status
  nextAiringEpisode {
    episode
  }
  seasonYear
  averageScore
  studios(isMain: true) {
    nodes {
      name
    }
  }
  staff(sort: [RELEVANCE, ID]) {
    edges {
      role
      node {
        id
        name {
          full
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
  recommendations(sort: RATING_DESC, perPage: 10) {
    nodes {
      mediaRecommendation {
        id
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
`;

// Helper function to fetch data from AniList with rate-limiting retry logic
const fetchAniListData = async (query: string, variables: object) => {
  const maxRetries = 5;
  let delay = 1000; // Start with 1 second for fallback

  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(ANILIST_API_URL, {
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
        console.error("AniList API Errors:", json.errors);
        throw new Error(`GraphQL Error: ${json.errors.map((e: any) => e.message).join(', ')}`);
      }
      return json.data;
    }

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After');
      // Use header value if present, otherwise use exponential backoff
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : delay;
      
      console.warn(`Rate limited by AniList API. Retrying in ${retryAfter / 1000} seconds... (Attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      delay *= 2; // Double the delay for the next potential fallback
      continue;
    }

    // For any other server error, fail immediately without retrying
    throw new Error(`AniList API error: ${response.status} ${response.statusText}`);
  }

  throw new Error(`Failed to fetch from AniList after ${maxRetries} attempts due to persistent rate limiting.`);
};

// Helper to map API response to our Anime type
const mapToAnime = (data: any): Anime => {
  // Basic sanitation for description
  const description = data.description
    ? data.description.replace(/<br\s*\/?>/gi, '\n').replace(/<i>|<\/i>/g, '')
    : 'No description available.';

  const staff: StaffMember[] = (data.staff?.edges || [])
    .slice(0, 15) // Limit staff to avoid clutter
    .map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name.full,
      role: edge.role,
    }));
  
  const relations: RelatedAnime[] = (data.relations?.edges || [])
    .filter((edge: any) => edge.node.type === 'ANIME') // Only include anime relations
    .map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title.english || edge.node.title.romaji,
      coverImage: edge.node.coverImage.extraLarge,
      relationType: edge.relationType,
    }));
  
  const recommendations: RecommendedAnime[] = (data.recommendations?.nodes || [])
    .filter((node: any) => node.mediaRecommendation)
    .map((node: any) => ({
      id: node.mediaRecommendation.id,
      title: node.mediaRecommendation.title.english || node.mediaRecommendation.title.romaji,
      coverImage: node.mediaRecommendation.coverImage.extraLarge,
    }));


  let episodeCount = data.episodes;
  if (data.status === 'RELEASING' && data.nextAiringEpisode) {
    // If it's airing, the number of released episodes is one less than the next to air.
    episodeCount = data.nextAiringEpisode.episode - 1;
  }

  return {
    anilistId: data.id,
    title: data.title.english || data.title.romaji,
    description,
    coverImage: data.coverImage.extraLarge,
    bannerImage: data.bannerImage || data.coverImage.extraLarge,
    genres: data.genres || [],
    episodes: episodeCount || 0,
    year: data.seasonYear,
    rating: data.averageScore,
    status: data.status,
    studios: data.studios?.nodes.map((n: any) => n.name) || [],
    staff,
    relations,
    recommendations,
  };
};

export const getHomePageData = async () => {
  const query = `
    query {
      trending: Page(page: 1, perPage: 10) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false, status_in: [RELEASING, FINISHED]) {
          ...animeFields
        }
      }
      popular: Page(page: 1, perPage: 24) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, status_in: [RELEASING, FINISHED]) {
          ...animeFields
        }
      }
      topAiring: Page(page: 1, perPage: 10) {
        media(sort: POPULARITY_DESC, type: ANIME, status: RELEASING, isAdult: false) {
          ...animeFields
        }
      }
    }

    fragment animeFields on Media {
      ${ANIME_FIELDS_FRAGMENT}
    }
  `;

  const data = await fetchAniListData(query, {});
  
  return {
    trending: data.trending.media.map(mapToAnime),
    popular: data.popular.media.map(mapToAnime),
    topAiring: data.topAiring.media.map(mapToAnime),
  };
};

export const discoverAnime = async (searchTerm: string, filters: FilterState, pageLimit = 2): Promise<Anime[]> => {
  const perPage = 50;
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
      $status_in: [MediaStatus]
    ) {
      Page(page: $page, perPage: $perPage) {
        media(
          search: $search,
          type: ANIME,
          sort: $sort,
          genre_in: $genres,
          season: $season,
          seasonYear: $seasonYear,
          format_in: $format_in,
          status_in: $status_in,
          isAdult: false
        ) {
          ...animeFields
        }
      }
    }
    fragment animeFields on Media {
      ${ANIME_FIELDS_FRAGMENT}
    }
  `;

  const buildVariables = (page: number) => {
    const variables: any = {
      search: searchTerm.trim() ? searchTerm.trim() : undefined,
      sort: [filters.sort],
      page,
      perPage,
    };
    if (filters.genres.length > 0) variables.genres = filters.genres;
    if (filters.year && !isNaN(parseInt(filters.year))) variables.seasonYear = parseInt(filters.year, 10);
    if (filters.season) variables.season = filters.season;
    if (filters.formats.length > 0) variables.format_in = filters.formats;
    if (filters.statuses.length > 0) variables.status_in = filters.statuses;
    return variables;
  }

  const pagePromises = Array.from({ length: pageLimit }, (_, i) => {
    const variables = buildVariables(i + 1);
    return fetchAniListData(query, variables);
  });

  try {
    const pageResults = await Promise.all(pagePromises);
    const allMedia = pageResults.flatMap(data => (data.Page && data.Page.media) ? data.Page.media : []);
    const mappedAnime = allMedia.map(mapToAnime);
    const uniqueAnime = Array.from(new Map(mappedAnime.map(anime => [anime.anilistId, anime])).values());
    return uniqueAnime;
  } catch (error) {
    console.error(`Failed to fetch discovery pages in parallel:`, error);
    return [];
  }
};


export const getAnimeDetails = async (id: number): Promise<Anime> => {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          ...animeFields
        }
      }
      fragment animeFields on Media {
        ${ANIME_FIELDS_FRAGMENT}
      }
    `;
    const variables = { id };
    const data = await fetchAniListData(query, variables);
    return mapToAnime(data.Media);
};

export const getAiringSchedule = async (): Promise<AiringSchedule[]> => {
    const query = `
      query ($airingAt_greater: Int, $airingAt_lesser: Int) {
        Page(page: 1, perPage: 50) {
          airingSchedules(airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME) {
            id
            episode
            airingAt
            media {
              id
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
    
    const now = Math.floor(Date.now() / 1000);
    // Get schedule for the next 7 days
    const sevenDaysLater = now + 7 * 24 * 60 * 60;

    const variables = { airingAt_greater: now, airingAt_lesser: sevenDaysLater };
    const data = await fetchAniListData(query, variables);
    return data.Page.airingSchedules;
};

export const getGenreCollection = async (): Promise<string[]> => {
    const query = `
      query {
        GenreCollection
      }
    `;
    const data = await fetchAniListData(query, {});
    return data.GenreCollection.filter((genre: string | null) => genre !== null);
};

// A more lightweight search for suggestions dropdown
export const getSearchSuggestions = async (searchTerm: string): Promise<SearchSuggestion[]> => {
  if (!searchTerm) return [];
  
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 8) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          id
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
    title: media.title.english || media.title.romaji,
    coverImage: media.coverImage.medium,
    year: media.seasonYear,
  }));
};