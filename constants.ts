import { StreamSource } from './types';

export const STREAM_URLS: Record<StreamSource, string> = {
  [StreamSource.Vidnest]: 'https://vidnest.fun/anime',
  [StreamSource.AnimePahe]: 'https://vidnest.fun/animepahe',
};

// A curated list of common genres from AniList
export const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];
