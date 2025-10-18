import { HiAnime, NextEpisodeSchedule } from '../types';

const HIANIME_API_BASE_URL = 'https://corsproxy.io/?https://hianime-api-blond.vercel.app/api/v2/hianime';

// This is a mock service as the actual HiAnime API is not provided for all features.
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

export const fetchNextEpisodeSchedule = async (animeId: string): Promise<NextEpisodeSchedule | null> => {
  try {
    const response = await fetch(`${HIANIME_API_BASE_URL}/anime/${animeId}/next-episode-schedule`);
    if (!response.ok) {
      // Don't throw an error for 404s, just return null as it means no schedule is available.
      console.warn(`Could not fetch schedule for ${animeId}: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching schedule for ${animeId}:`, error);
    return null;
  }
};