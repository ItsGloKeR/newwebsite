import { StreamSource, StreamLanguage } from '../types';

const PLAYER_SETTINGS_KEY = 'aniGlokPlayerSettings';

interface PlayerSettings {
  source: StreamSource;
  language: StreamLanguage;
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