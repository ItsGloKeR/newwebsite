import { StreamSource } from './types';

export const STREAM_URLS: Record<StreamSource, string> = {
  [StreamSource.Vidnest]: 'https://vidnest.fun/anime/{anilistId}/{episode}/{language}',
  [StreamSource.AnimePahe]: 'https://vidnest.fun/animepahe/{anilistId}/{episode}/{language}',
  [StreamSource.Vidlink]: 'https://vidlink.pro/anime/{malId}/{episode}/{language}',
  [StreamSource.ExternalPlayer]: '', // This is handled dynamically in AdminContext
};

// SVG data URI for a simple grey placeholder image with a 2:3 aspect ratio
export const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'%3E%3Crect width='100%25' height='100%25' fill='%23374151'/%3E%3C/svg%3E";

// SVG data URI for a default user avatar icon
export const DEFAULT_AVATAR_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234b5563'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' clip-rule='evenodd' /%3E%3C/svg%3E";
