import { StreamSource } from './types';

export const STREAM_URLS: Record<StreamSource, string> = {
  [StreamSource.Consumet]: '', // Handled dynamically by the player
  [StreamSource.Vidnest]: 'https://vidnest.fun/anime/{anilistId}/{episode}/{language}',
  [StreamSource.AnimePahe]: 'https://vidnest.fun/animepahe/{anilistId}/{episode}/{language}',
  [StreamSource.Vidlink]: 'https://vidlink.pro/anime/{malId}/{episode}/{language}',
  [StreamSource.Vidsrc]: 'https://vidsrc.cc/v2/embed/anime/{id}/{episode}/{language}',
  [StreamSource.VidsrcIcu]: 'https://vidsrc.icu/embed/anime/{id}/{episode}/{dub}',
  [StreamSource.HiAnime]: 'https://megaplay.buzz/stream/s-2/{hianime-ep-id}/{language}',
  [StreamSource.HiAnimeV2]: '', // Handled dynamically by the player
  [StreamSource.SlayKnight]: 'https://slay-knight.xyz/player/{anilistId}/{episode}/{language}#22d3ee',
};

// SVG data URI for a simple grey placeholder image with a 2:3 aspect ratio
export const PLACEHOLDER_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'%3E%3Crect width='100%25' height='100%25' fill='%23374151'/%3E%3C/svg%3E";

// SVG data URI for a default user avatar icon
export const DEFAULT_AVATAR_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234b5563'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' clip-rule='evenodd' /%3E%3C/svg%3E";

// Predefined avatars for user selection
export const PREDEFINED_AVATARS = [
  "data:image/svg+xml,%3csvg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' stop-color='%2306b6d4'/%3e%3cstop offset='100%25' stop-color='%233b82f6'/%3e%3c/linearGradient%3e%3c/defs%3e%3ccircle cx='40' cy='40' r='36' fill='url(%23g1)'/%3e%3c/svg%3e",
  "data:image/svg+xml,%3csvg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' stop-color='%23a855f7'/%3e%3cstop offset='100%25' stop-color='%23ec4899'/%3e%3c/linearGradient%3e%3c/defs%3e%3crect x='10' y='10' width='60' height='60' rx='8' fill='url(%23g1)' transform='rotate(45 40 40)'/%3e%3c/svg%3e",
  "data:image/svg+xml,%3csvg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' stop-color='%23f59e0b'/%3e%3cstop offset='100%25' stop-color='%23ef4444'/%3e%3c/linearGradient%3e%3c/defs%3e%3cpath d='M40 4 L76 76 H4 Z' fill='url(%23g1)'/%3e%3c/svg%3e",
  "data:image/svg+xml,%3csvg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' stop-color='%2310b981'/%3e%3cstop offset='100%25' stop-color='%2384cc16'/%3e%3c/linearGradient%3e%3c/defs%3e%3cpath d='M40,4 C60,4 76,20 76,40 C76,60 60,76 40,76 C20,76 4,60 4,40 C4,20 20,4 40,4 Z M40,12 C55,12 68,25 68,40 C68,55 55,68 40,68 C25,68 12,55 12,40 C12,25 25,12 40,12 Z' fill='url(%23g1)'/%3e%3c/svg%3e",
  "data:image/svg+xml,%3csvg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M4 4 H76 V76 H4Z' fill='%231f2937'/%3e%3cpath d='M10 10 H30 V30 H10Z M50 10 H70 V30 H50Z M10 50 H30 V70 H10Z M50 50 H70 V70 H50Z' fill='%23ec4899'/%3e%3c/svg%3e",
  "data:image/svg+xml,%3csvg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='40' cy='40' r='36' fill='%231f2937'/%3e%3cpath d='M40 10 L50 30 L70 40 L50 50 L40 70 L30 50 L10 40 L30 30Z' fill='%23f59e0b'/%3e%3c/svg%3e",
  "data:image/svg+xml,%3csvg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M4 40 C4 20, 20 4, 40 4 S76 20, 76 40' fill='none' stroke='%233b82f6' stroke-width='8' stroke-linecap='round'/%3e%3cpath d='M4 40 C4 60, 20 76, 40 76 S76 60, 76 40' fill='none' stroke='%23a855f7' stroke-width='8' stroke-linecap='round'/%3e%3c/svg%3e",
  "data:image/svg+xml,%3csvg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M40 4 L10 70 L70 70 Z' fill='none' stroke-width='8' stroke='%2310b981' stroke-linejoin='round'/%3e%3ccircle cx='40' cy='50' r='10' fill='%2310b981'/%3e%3c/svg%3e",
];