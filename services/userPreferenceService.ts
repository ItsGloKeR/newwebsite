import { StreamSource, StreamLanguage } from '../types';

const V1_PLAYER_SETTINGS_KEY = 'aniGlokPlayerSettings';
const V2_PLAYER_SETTINGS_KEY = 'aniGlokPlayerSettings_v2';
const PLAYER_SETTINGS_KEY = 'aniGlokPlayerSettings_v3'; // Current version

interface OldPlayerSettingsV1 {
  source: StreamSource;
  language: StreamLanguage;
}

interface OldPlayerSettingsV2 {
    lastUsedSource: StreamSource;
    languagePrefs: Partial<Record<StreamSource, StreamLanguage>>;
    hiAnimeLanguagePrefs: Record<string, StreamLanguage>;
}

interface PlayerSettings {
    lastUsedSource: StreamSource;
    languagePrefs: Partial<Record<StreamSource, StreamLanguage>>;
    perAnimeLanguagePrefs: Partial<Record<StreamSource, Record<string, StreamLanguage>>>;
}

const defaultSettings: PlayerSettings = {
    lastUsedSource: StreamSource.Vidsrc,
    languagePrefs: {},
    perAnimeLanguagePrefs: {},
};

/**
 * Gets the entire player settings object, handling migration from older versions.
 */
export const getFullPlayerSettings = (): PlayerSettings => {
    try {
        // 1. Try to load the current version (v3)
        const v3SettingsStr = localStorage.getItem(PLAYER_SETTINGS_KEY);
        if (v3SettingsStr) {
            const parsed = JSON.parse(v3SettingsStr);
            if (parsed.lastUsedSource && parsed.languagePrefs && parsed.perAnimeLanguagePrefs && Object.values(StreamSource).includes(parsed.lastUsedSource)) {
                return parsed;
            }
        }

        // 2. If v3 fails, try to migrate from v2
        const v2SettingsStr = localStorage.getItem(V2_PLAYER_SETTINGS_KEY);
        if (v2SettingsStr) {
            const v2Settings: OldPlayerSettingsV2 = JSON.parse(v2SettingsStr);
            if (v2Settings.lastUsedSource && v2Settings.languagePrefs) {
                const migrated: PlayerSettings = {
                    lastUsedSource: v2Settings.lastUsedSource,
                    languagePrefs: v2Settings.languagePrefs,
                    perAnimeLanguagePrefs: v2Settings.hiAnimeLanguagePrefs ? { [StreamSource.HiAnime]: v2Settings.hiAnimeLanguagePrefs } : {},
                };
                localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(migrated));
                localStorage.removeItem(V2_PLAYER_SETTINGS_KEY);
                console.log("Migrated v2 player settings to v3.");
                return migrated;
            }
        }
        
        // 3. If v2 fails, try to migrate from v1
        const v1SettingsStr = localStorage.getItem(V1_PLAYER_SETTINGS_KEY);
        if (v1SettingsStr) {
            const v1Settings: OldPlayerSettingsV1 = JSON.parse(v1SettingsStr);
            if (v1Settings.source && v1Settings.language) {
                 const migrated: PlayerSettings = {
                    ...defaultSettings,
                    lastUsedSource: v1Settings.source,
                    languagePrefs: { [v1Settings.source]: v1Settings.language },
                };
                localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(migrated));
                localStorage.removeItem(V1_PLAYER_SETTINGS_KEY);
                console.log("Migrated v1 player settings to v3.");
                return migrated;
            }
        }

    } catch (error) {
        console.error("Error reading/migrating player settings from localStorage", error);
    }
    
    // 4. If all else fails, return defaults
    return defaultSettings;
};

/**
 * Retrieves the last used source and the best-matching language preference.
 * Priority: Per-Anime -> Per-Source -> Default (Sub).
 */
export const getLastPlayerSettings = (animeId?: number): { source: StreamSource; language: StreamLanguage } => {
    const settings = getFullPlayerSettings();
    const source = settings.lastUsedSource;
    let language: StreamLanguage;

    if (animeId) {
        language = settings.perAnimeLanguagePrefs?.[source]?.[animeId] || settings.languagePrefs[source] || StreamLanguage.Sub;
    } else {
        language = settings.languagePrefs[source] || StreamLanguage.Sub;
    }
    
    return { source, language };
};

/**
 * Saves the user's selected source and language to localStorage.
 * This updates both the per-anime preference and the general preference for the source.
 */
export const setLastPlayerSettings = (source: StreamSource, language: StreamLanguage, animeId?: number): void => {
  try {
    const settings = getFullPlayerSettings();
    const newSettings = { ...settings, lastUsedSource: source };

    // Update per-anime preference if an ID is provided
    if (animeId) {
        const sourcePrefs = newSettings.perAnimeLanguagePrefs[source] || {};
        newSettings.perAnimeLanguagePrefs = {
            ...newSettings.perAnimeLanguagePrefs,
            [source]: {
                ...sourcePrefs,
                [animeId]: language,
            },
        };
    }
    
    // Also update the global preference for this source, so it becomes the new default for this source
    newSettings.languagePrefs = {
        ...newSettings.languagePrefs,
        [source]: language,
    };

    localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error("Failed to save player settings to localStorage", error);
  }
};