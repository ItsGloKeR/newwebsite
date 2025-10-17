
import { Anime, RelatedAnime, StaffMember, AiringSchedule } from '../types';

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
`;

// Helper function to fetch data from AniList
const fetchAniListData = async (query: string, variables: object) => {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors) {
    console.error("AniList API Errors:", json.errors);
    throw new Error(`GraphQL Error: ${json.errors.map((e: any) => e.message).join(', ')}`);
  }

  return json.data;
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

  let episodeCount = data.episodes;
  if (data.nextAiringEpisode) {
    // If there's a next airing episode, the number of released episodes is one less.
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
    studios: data.studios?.nodes.map((n: any) => n.name) || [],
    staff,
    relations,
  };
};

export const getHomePageData = async () => {
  const query = `
    query {
      trending: Page(page: 1, perPage: 10) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ...animeFields
        }
      }
      popular: Page(page: 1, perPage: 24) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
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

export const searchAnime = async (searchTerm: string, page = 1, perPage = 20) => {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ...animeFields
        }
      }
    }
    fragment animeFields on Media {
      ${ANIME_FIELDS_FRAGMENT}
    }
  `;
  const variables = { search: searchTerm, page, perPage };
  const data = await fetchAniListData(query, variables);
  return data.Page.media.map(mapToAnime);
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
