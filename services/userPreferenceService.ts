import { StreamSource, StreamLanguage } from '../types';

const OLD_PLAYER_SETTINGS_KEY = 'aniGlokPlayerSettings';
const PLAYER_SETTINGS_KEY = 'aniGlokPlayerSettings_v2'; // New key for the new structure

interface OldPlayerSettings {
  source: StreamSource;
  language: StreamLanguage;
}

interface PlayerSettings {
    lastUsedSource: StreamSource;
    languagePrefs: Partial<Record<StreamSource, StreamLanguage>>;
}

const defaultSettings: PlayerSettings = {
    lastUsedSource: StreamSource.AnimePahe,
    languagePrefs: {},
};

// This function will handle migration from the old simple settings format.
function migrateOldSettings(): PlayerSettings | null {
    try {
        const oldSettingsStr = localStorage.getItem(OLD_PLAYER_SETTINGS_KEY);
        if (oldSettingsStr) {
            const oldSettings: OldPlayerSettings = JSON.parse(oldSettingsStr);
            if (oldSettings.source && oldSettings.language) {
                // Create a new settings object where the old language is applied to all sources as a starting point.
                const newSettings: PlayerSettings = {
                    lastUsedSource: oldSettings.source,
                    languagePrefs: {
                        [StreamSource.AnimePahe]: oldSettings.language,
                        [StreamSource.Vidnest]: oldSettings.language,
                        [StreamSource.Vidlink]: oldSettings.language,
                        [StreamSource.ExternalPlayer]: oldSettings.language,
                        [StreamSource.Vidsrc]: oldSettings.language,
                    }
                };
                localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(newSettings));
                // Clean up the old key to prevent re-migration.
                localStorage.removeItem(OLD_PLAYER_SETTINGS_KEY);
                console.log('Migrated old player settings to per-source structure.');
                return newSettings;
            }
        }
    } catch (e) {
        console.error('Failed to migrate old player settings', e);
    }
    return null;
}

/**
 * Gets the entire player settings object, including per-source preferences.
 * Handles migration from old settings format if necessary.
 */
export const getFullPlayerSettings = (): PlayerSettings => {
    try {
        const storedSettings = localStorage.getItem(PLAYER_SETTINGS_KEY);
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            if (parsed.lastUsedSource && parsed.languagePrefs) {
                return parsed;
            }
        }
        
        // If new settings don't exist, try to migrate from old ones.
        const migratedSettings = migrateOldSettings();
        if (migratedSettings) {
            return migratedSettings;
        }

    } catch (error) {
        console.error("Failed to get player settings from localStorage", error);
    }
    return defaultSettings;
};

/**
 * Retrieves the last used source and the language preference for that source.
 * Returns default settings if none are found.
 */
export const getLastPlayerSettings = (): { source: StreamSource; language: StreamLanguage } => {
    const settings = getFullPlayerSettings();
    const language = settings.languagePrefs[settings.lastUsedSource] || StreamLanguage.Sub;
    return {
        source: settings.lastUsedSource,
        language: language,
    };
};

/**
 * Saves the user's selected source and language to localStorage.
 * Updates the language preference for the given source and sets it as the last used source.
 * @param source The selected stream source.
 * @param language The selected stream language for that source.
 */
export const setLastPlayerSettings = (source: StreamSource, language: StreamLanguage): void => {
  try {
    const settings = getFullPlayerSettings();
    const newSettings: PlayerSettings = {
        lastUsedSource: source,
        languagePrefs: {
            ...settings.languagePrefs,
            [source]: language,
        },
    };
    localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error("Failed to save player settings to localStorage", error);
  }
};
