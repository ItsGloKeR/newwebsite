import { StreamSource } from './types';

export const STREAM_URLS: Record<StreamSource, string> = {
  [StreamSource.Vidnest]: 'https://vidnest.fun/anime/{anilistId}/{episode}/{language}',
  [StreamSource.AnimePahe]: 'https://vidnest.fun/animepahe/{anilistId}/{episode}/{language}',
};
