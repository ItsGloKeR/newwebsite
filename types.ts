// types.ts

// Enums
export enum StreamSource {
  AnimePahe = 'animepahe',
  Vidnest = 'vidnest',
  Vidlink = 'vidlink',
  ExternalPlayer = 'externalplayer',
}

export enum StreamLanguage {
  Sub = 'sub',
  Dub = 'dub',
  Hindi = 'hindi',
}

export enum MediaSort {
  POPULARITY_DESC = 'POPULARITY_DESC',
  TRENDING_DESC = 'TRENDING_DESC',
  SCORE_DESC = 'SCORE_DESC',
  FAVOURITES_DESC = 'FAVOURITES_DESC',
  START_DATE_DESC = 'START_DATE_DESC',
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

export enum MediaSeason {
  WINTER = 'WINTER',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL',
}

// Interfaces and Types
export interface StaffMember {
  id: number;
  name: string;
  role: string;
}

export interface RelatedAnime {
  id: number;
  englishTitle: string;
  romajiTitle: string;
  coverImage: string;
  relationType: string;
  isAdult: boolean;
  episodes: number | null;
  progress?: number;
}

export interface RecommendedAnime {
  id: number;
  englishTitle: string;
  romajiTitle: string;
  coverImage: string;
  isAdult: boolean;
  episodes: number | null;
  progress?: number;
}

export interface AnimeTrailer {
  id: string;
  site: string;
}

export interface NextAiringEpisode {
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
}

export interface Anime {
  anilistId: number;
  malId?: number;
  englishTitle: string;
  romajiTitle: string;
  description: string;
  coverImage: string;
  coverImageColor?: string;
  bannerImage: string;
  genres: string[];
  episodes: number;
  duration: number | null;
  year: number;
  rating: number;
  status: string;
  format: string;
  studios: string[];
  staff: StaffMember[];
  relations: RelatedAnime[];
  trailer?: AnimeTrailer;
  recommendations: RecommendedAnime[];
  nextAiringEpisode?: NextAiringEpisode;
  isAdult: boolean;
  progress?: number;
}

export interface SearchSuggestion {
  anilistId: number;
  englishTitle: string;
  romajiTitle: string;
  coverImage: string;
  year: number;
  isAdult: boolean;
  episodes: number | null;
}

export interface FilterState {
  genres: string[];
  year: string;
  season?: MediaSeason;
  formats: MediaFormat[];
  statuses: MediaStatus[];
  sort: MediaSort;
}

export interface AiringSchedule {
  id: number;
  episode: number;
  airingAt: number;
  media: {
    id: number;
    isAdult: boolean;
    episodes: number | null;
    genres?: string[];
    title: {
      romaji: string;
      english: string;
    };
    coverImage: {
      extraLarge: string;
    };
  };
}

export interface EnrichedAiringSchedule extends AiringSchedule {
  progress?: number;
}

export interface ZenshinMapping {
  mappings: {
    imdb_id?: string;
    mal_id?: number;
  };
  episodes: {
    [key: string]: {
      title?: {
        en?: string;
      };
      overview?: string;
      seasonNumber?: number;
      episodeNumber?: number;
    };
  };
}

export interface HiAnime {
  id: string;
  title: string;
  coverImage: string;
}

export interface NextEpisodeSchedule {
  airingAt: number;
  episode: number;
}

export interface AnimeOverride {
  title?: string;
  streamUrlTemplates?: {
    [source in StreamSource]?: string;
  };
  episodes?: {
    [episode: number]: {
      [source in StreamSource]?: string;
    };
  };
}

export interface AdminOverrides {
  anime: {
    [animeId: number]: AnimeOverride;
  };
  globalStreamUrlTemplates: {
    [source in StreamSource]?: string;
  };
}

// Progress Tracking Types
export interface MediaProgressEntry {
  id: number;
  type: 'tv' | 'movie';
  title: string;
  poster_path: string;
  progress: {
    watched: number;
    duration: number;
  };
  last_season_watched: string;
  last_episode_watched: string;
  show_progress: {
    [seasonEpisodeKey: string]: {
        progress: {
            watched: number;
            duration: number;
        }
    }
  };
  lastAccessed?: number;
}

export interface MediaProgress {
  [anilistId: string]: MediaProgressEntry;
}

export type PlayerEventCallback = (data: any) => void;
export type TitleLanguage = 'english' | 'romaji';