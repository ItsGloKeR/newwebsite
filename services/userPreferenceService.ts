import { StreamSource, StreamLanguage } from '../types';

const PLAYER_SETTINGS_KEY = 'aniGlokPlayerSettings';
const LAST_WATCHED_EPISODE_KEY = 'aniGlokLastWatchedEpisodes';

interface PlayerSettings {
  source: StreamSource;
  language: StreamLanguage;
}

interface LastWatchedEpisodes {
  [anilistId: number]: number;
}

/**
 * Retrieves the last used player settings (source and language) from localStorage.
 * Returns default settings if none are found or if the stored data is invalid.
 */
export const getLastPlayerSettings = (): PlayerSettings => {
  try {
    const storedSettings = localStorage.getItem(PLAYER_SETTINGS_KEY);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      // Validate that the stored values are valid enum members
      if (Object.values(StreamSource).includes(parsed.source) && Object.values(StreamLanguage).includes(parsed.language)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to get player settings from localStorage", error);
  }
  // Return defaults if not found or if data is corrupted/invalid
  return {
    source: StreamSource.AnimePahe,
    language: StreamLanguage.Sub,
  };
};

/**
 * Saves the user's selected source and language to localStorage.
 * @param source The selected stream source.
 * @param language The selected stream language.
 */
export const setLastPlayerSettings = (source: StreamSource, language: StreamLanguage): void => {
  try {
    const settings: PlayerSettings = { source, language };
    localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save player settings to localStorage", error);
  }
};

/**
 * Retrieves all last watched episode numbers from localStorage.
 */
const getLastWatchedEpisodes = (): LastWatchedEpisodes => {
  try {
    const stored = localStorage.getItem(LAST_WATCHED_EPISODE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to get last watched episodes from localStorage", error);
    return {};
  }
};

/**
 * Retrieves the last watched episode for a specific anime.
 * @param anilistId The anilist ID of the anime.
 * @returns The episode number or null if not found.
 */
export const getLastWatchedEpisode = (anilistId: number): number | null => {
  const allEpisodes = getLastWatchedEpisodes();
  return allEpisodes[anilistId] || null;
};

/**
 * Saves the last watched episode for a specific anime.
 * @param anilistId The anilist ID of the anime.
 * @param episode The episode number.
 */
export const setLastWatchedEpisode = (anilistId: number, episode: number): void => {
  try {
    const allEpisodes = getLastWatchedEpisodes();
    allEpisodes[anilistId] = episode;
    localStorage.setItem(LAST_WATCHED_EPISODE_KEY, JSON.stringify(allEpisodes));
  } catch (error) {
    console.error("Failed to save last watched episode to localStorage", error);
  }
};
