
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

export enum StreamSource {
  Vidnest = 'Vidnest',
  AnimePahe = 'AnimePahe',
}

export enum StreamLanguage {
  Sub = 'sub',
  Dub = 'dub',
}

export interface HiAnime {
    id: string;
    title: string;
    coverImage: string;
    url: string;
}

export interface HomePageData {
    trending: Anime[];
    popular: Anime[];
    topAiring: Anime[];
}
