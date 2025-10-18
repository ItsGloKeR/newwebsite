// FIX: Define and export StreamSource enum to resolve circular dependency and typing errors.
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

export interface RecommendedAnime {
  id: number;
  title: string;
  coverImage: string;
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
  status: string;
  studios: string[];
  staff: StaffMember[];
  relations: RelatedAnime[];
  recommendations?: RecommendedAnime[];
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

export interface SearchSuggestion {
  anilistId: number;
  title: string;
  coverImage: string;
  year: number;
}

// Advanced Filtering & Sorting Types
export enum MediaSeason {
  WINTER = 'WINTER',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL',
}

export enum MediaFormat {
  TV = 'TV',
  TV_SHORT = 'TV_SHORT',
  MOVIE = 'MOVIE',
  SPECIAL = 'SPECIAL',
  OVA = 'OVA',
  ONA = 'ONA',
  MUSIC = 'MUSIC',
}

export enum MediaStatus {
  FINISHED = 'FINISHED',
  RELEASING = 'RELEASING',
  NOT_YET_RELEASED = 'NOT_YET_RELEASED',
  CANCELLED = 'CANCELLED',
  HIATUS = 'HIATUS',
}

export enum MediaSort {
  POPULARITY_DESC = 'POPULARITY_DESC',
  TRENDING_DESC = 'TRENDING_DESC',
  SCORE_DESC = 'SCORE_DESC',
  FAVOURITES_DESC = 'FAVOURITES_DESC',
  START_DATE_DESC = 'START_DATE_DESC',
}

export interface FilterState {
  genres: string[];
  year: string;
  season?: MediaSeason;
  formats: MediaFormat[];
  statuses: MediaStatus[];
  sort: MediaSort;
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