export enum StreamSource {
  Vidnest = 'vidnest',
  AnimePahe = 'animepahe',
}

export enum StreamLanguage {
  Sub = 'sub',
  Dub = 'dub',
  Hindi = 'hindi',
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
}

export interface RelatedAnime {
  id: number;
  title: string;
  coverImage: string;
  relationType: string;
}

export interface Anime {
  anilistId: number;
  title: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  genres: string[];
  episodes: number;
  year: number;
  rating: number;
  studios: string[];
  staff: StaffMember[];
  relations: RelatedAnime[];
}

export interface AiringSchedule {
  id: number;
  episode: number;
  airingAt: number; // timestamp
  media: {
    id: number;
    title: {
      romaji: string;
      english?: string;
    };
    coverImage: {
      extraLarge: string;
    };
  };
}

export interface NextEpisodeSchedule {
  secondsUntilAiring: number;
}

export interface HiAnime {
  id: string;
  title: string;
  coverImage: string;
}

// Admin Panel Types - NEW STRUCTURE

export interface EpisodeOverride {
  [StreamSource.Vidnest]?: string; // Full URL for the episode
  [StreamSource.AnimePahe]?: string; // Full URL for the episode
}

export interface AnimeOverride {
  title?: string;
  // URL Template for a specific anime, e.g. https://.../anime/{episode}/{language}
  streamUrlTemplates?: Partial<Record<StreamSource, string>>;
  // Per-episode full URL overrides
  episodes?: Record<number, Partial<EpisodeOverride>>; // episode number -> override
}

export interface AdminOverrides {
  // anilistId -> AnimeOverride
  anime: Record<number, AnimeOverride>;
  // Global URL templates as a fallback
  globalStreamUrlTemplates: Partial<Record<StreamSource, string>>;
}
