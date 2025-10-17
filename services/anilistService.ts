import { Anime } from '../types';

const ANILIST_API_URL = 'https://graphql.anilist.co';

const ANIME_QUERY_FRAGMENT = `
  id
  title {
    romaji
    english
  }
  description(asHtml: false)
  coverImage {
    extraLarge
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
  staff(perPage: 15, sort: RELEVANCE) {
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
        title {
          romaji
        }
        coverImage {
          large
        }
      }
    }
  }
`;

// Helper function to fetch from AniList API
const fetchAniList = async (query: string, variables: object) => {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const json = await response.json();
  return json.data;
};

// Helper function to map API data to our Anime type
const mapAniListDataToAnime = (data: any): Anime => {
  if (!data) return {} as Anime; // Should not happen in normal flow

  let currentEpisodeCount = 1;
  if (data.nextAiringEpisode && data.nextAiringEpisode.episode) {
    // This anime is currently airing. The last available episode is the one before the next one.
    currentEpisodeCount = data.nextAiringEpisode.episode - 1;
  } else if (data.episodes) {
    // This anime has finished airing or has a known total.
    currentEpisodeCount = data.episodes;
  }

  return {
    anilistId: data.id,
    title: data.title.romaji || data.title.english || '',
    description: data.description?.replace(/<br><br>/g, '\n').replace(/<br>/g, '\n').replace(/<[^>]+>/g, '') || '',
    coverImage: data.coverImage.extraLarge,
    bannerImage: data.bannerImage || data.coverImage.extraLarge,
    genres: data.genres,
    episodes: currentEpisodeCount,
    year: data.seasonYear,
    rating: data.averageScore,
    studios: data.studios.nodes.map((studio: any) => studio.name),
    staff: data.staff.edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name.full,
      role: edge.role,
    })),
    relations: data.relations.edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title.romaji,
      coverImage: edge.node.coverImage.large,
      relationType: edge.relationType.replace(/_/g, ' '),
    })),
  };
};

export const searchAnime = async (search: string): Promise<Anime[]> => {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          ${ANIME_QUERY_FRAGMENT}
        }
      }
    }
  `;
  const variables = { search, page: 1, perPage: 20 };
  const data = await fetchAniList(query, variables);
  return data.Page.media.map(mapAniListDataToAnime);
};

export const fetchAnimeById = async (id: number): Promise<Anime> => {
    const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${ANIME_QUERY_FRAGMENT}
      }
    }
  `;
  const variables = { id };
  const data = await fetchAniList(query, variables);
  return mapAniListDataToAnime(data.Media);
}

export const fetchPopularAnime = async (): Promise<Anime[]> => {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ${ANIME_QUERY_FRAGMENT}
        }
      }
    }
  `;
  const variables = { page: 1, perPage: 30 };
  const data = await fetchAniList(query, variables);
  return data.Page.media.map(mapAniListDataToAnime);
};