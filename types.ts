export enum StreamSource {
  Vidnest = 'vidnest',
  AnimePahe = 'animepahe',
}

export enum StreamLanguage {
  Sub = 'sub',
  Dub = 'dub',
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
