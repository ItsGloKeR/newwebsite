import { StreamSource } from './types';

export const STREAM_URLS: Record<StreamSource, string> = {
  [StreamSource.Vidnest]: 'https://vidnest.fun/anime/{anilistId}/{episode}/{language}',
  [StreamSource.AnimePahe]: 'https://vidnest.fun/animepahe/{anilistId}/{episode}/{language}',
  [StreamSource.Vidlink]: 'https://vidlink.pro/anime/{malId}/{episode}/{language}',
  [StreamSource.ExternalPlayer]: '', // This is handled dynamically in AdminContext
};

// SVG data URI for a simple grey placeholder image with a 2:3 aspect ratio
export const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'%3E%3Crect width='100%25' height='100%25' fill='%23374151'/%3E%3C/svg%3E";