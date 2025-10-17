
import { HiAnime } from '../types';

// This is a mock service as the actual HiAnime API is not provided.
// It returns some placeholder data.

const mockHiAnime: HiAnime[] = [
  { id: '1', title: 'Mock Anime 1 from HiAnime', coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153518-7FNR7zLsdAQF.jpg' },
  { id: '2', title: 'Mock Anime 2 from HiAnime', coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-m5ZlO3YsoT42.jpg' },
  { id: '3', title: 'Mock Anime 3 from HiAnime', coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-L1mI8aD9D21h.jpg' },
  { id: '4', title: 'Mock Anime 4 from HiAnime', coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-f2MYoE5m2g2F.jpg' },
  { id: '5', title: 'Mock Anime 5 from HiAnime', coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx124381-4a1WrcmMApG6.png' },
];

export const getFeaturedAnime = async (): Promise<HiAnime[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockHiAnime);
    }, 500);
  });
};
