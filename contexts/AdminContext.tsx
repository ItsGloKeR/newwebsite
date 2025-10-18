import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { AdminOverrides, StreamSource, StreamLanguage, AnimeOverride } from '../types';
import { STREAM_URLS } from '../constants';
import { staticOverrides } from '../overrides/data';

const ADMIN_STORAGE_KEY = 'aniGlokAdminOverrides_v2'; // New key for new structure
const ADMIN_SESSION_KEY = 'aniGlokAdminSession';

interface AdminContextType {
  isAdmin: boolean;
  overrides: AdminOverrides;
  localOverrides: AdminOverrides;
  login: (password: string) => boolean;
  logout: () => void;
  updateTitle: (animeId: number, newTitle: string) => void;
  updateGlobalStreamUrlTemplate: (source: StreamSource, newUrl: string) => void;
  updateAnimeStreamUrlTemplate: (animeId: number, source: StreamSource, newUrl: string) => void;
  updateEpisodeStreamUrl: (animeId: number, episode: number, source: StreamSource, newUrl: string) => void;
  getStreamUrl: (animeId: number, episode: number, source: StreamSource, language: StreamLanguage) => string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const getInitialLocalOverrides = (): AdminOverrides => {
  try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Basic validation for the new structure
      if (parsed.anime && parsed.globalStreamUrlTemplates) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse admin overrides from localStorage", error);
  }
  return { anime: {}, globalStreamUrlTemplates: {} };
};

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
        return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
        return false;
    }
  });
  const [localOverrides, setLocalOverrides] = useState<AdminOverrides>(getInitialLocalOverrides);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(localOverrides));
    } catch (error) {
      console.error("Failed to save admin overrides to localStorage", error);
    }
  }, [localOverrides]);

  const mergedOverrides = useMemo((): AdminOverrides => ({
      globalStreamUrlTemplates: { ...staticOverrides.globalStreamUrlTemplates, ...localOverrides.globalStreamUrlTemplates },
      anime: { ...staticOverrides.anime, ...localOverrides.anime },
  }), [localOverrides]);

  const login = (password: string): boolean => {
    if (password === 'password') {
      setIsAdmin(true);
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } catch {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    try {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
  };

  const updateAnimeRecord = (animeId: number, updateFn: (record: AnimeOverride) => AnimeOverride) => {
    setLocalOverrides(prev => {
        const existingRecord = prev.anime[animeId] || {};
        const newRecord = updateFn(existingRecord);
        return {
            ...prev,
            anime: {
                ...prev.anime,
                [animeId]: newRecord,
            }
        };
    });
  };

  const updateTitle = (animeId: number, newTitle: string) => {
    updateAnimeRecord(animeId, record => ({ ...record, title: newTitle }));
  };

  const updateGlobalStreamUrlTemplate = (source: StreamSource, newUrl: string) => {
    setLocalOverrides(prev => ({
      ...prev,
      globalStreamUrlTemplates: {
        ...prev.globalStreamUrlTemplates,
        [source]: newUrl,
      },
    }));
  };

  const updateAnimeStreamUrlTemplate = (animeId: number, source: StreamSource, newUrl: string) => {
    updateAnimeRecord(animeId, record => ({
        ...record,
        streamUrlTemplates: {
            ...record.streamUrlTemplates,
            [source]: newUrl,
        }
    }));
  };

  const updateEpisodeStreamUrl = (animeId: number, episode: number, source: StreamSource, newUrl: string) => {
    updateAnimeRecord(animeId, record => ({
        ...record,
        episodes: {
            ...record.episodes,
            [episode]: {
                ...record.episodes?.[episode],
                [source]: newUrl,
            }
        }
    }));
  };

  const getStreamUrl = useCallback((animeId: number, episode: number, source: StreamSource, language: StreamLanguage): string => {
    // Priority 1: Episode-specific full URL override
    const episodeOverride = mergedOverrides.anime[animeId]?.episodes?.[episode]?.[source];
    if (episodeOverride && episodeOverride.trim() !== '') {
      return episodeOverride;
    }

    const replaceTokens = (template: string) => {
        return template
            .replace('{anilistId}', String(animeId))
            .replace('{episode}', String(episode))
            .replace('{language}', language);
    };

    // Priority 2: Anime-specific URL template override
    let animeTemplate = mergedOverrides.anime[animeId]?.streamUrlTemplates?.[source];
    if (animeTemplate && animeTemplate.trim() !== '') {
      // If the template doesn't include {episode}, treat it as a base URL and append the rest.
      if (!animeTemplate.includes('{episode}')) {
          // Ensure no trailing slash before appending
          if (animeTemplate.endsWith('/')) {
            animeTemplate = animeTemplate.slice(0, -1);
          }
          // Automatically append episode and language for simple base URLs.
          animeTemplate = `${animeTemplate}/{episode}/{language}`;
      }
      return replaceTokens(animeTemplate);
    }

    // Priority 3: Global URL template override
    const globalTemplate = mergedOverrides.globalStreamUrlTemplates[source];
    if (globalTemplate && globalTemplate.trim() !== '') {
      return replaceTokens(globalTemplate);
    }

    // Priority 4: Default hardcoded URL template
    const defaultTemplate = STREAM_URLS[source];
    return replaceTokens(defaultTemplate);
  }, [mergedOverrides]);


  const value = {
    isAdmin,
    overrides: mergedOverrides,
    localOverrides,
    login,
    logout,
    updateTitle,
    updateGlobalStreamUrlTemplate,
    updateAnimeStreamUrlTemplate,
    updateEpisodeStreamUrl,
    getStreamUrl,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};