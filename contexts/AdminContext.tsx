import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { AdminOverrides, StreamSource, StreamLanguage, AnimeOverride, ZenshinMapping, HiAnimeInfo } from '../types';
import { STREAM_URLS } from '../constants';
import { staticOverrides } from '../overrides/data';
import { useAuth } from './AuthContext';
import { signInWithEmail, logout as firebaseLogout, getUserProfile } from '../services/firebaseService';

const ADMIN_STORAGE_KEY = 'aniGlokAdminOverrides_v2'; // New key for new structure
const ADMIN_SESSION_KEY = 'aniGlokAdminSession';
const ADMIN_MODE_KEY = 'aniGlokAdminMode';

interface GetStreamUrlParams {
  animeId: number;
  malId?: number;
  episode: number;
  source: StreamSource;
  language: StreamLanguage;
  zenshinData?: ZenshinMapping | null;
  animeFormat?: string;
  hiAnimeInfo?: HiAnimeInfo | null;
}

interface AdminContextType {
  isAdmin: boolean;
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  overrides: AdminOverrides;
  localOverrides: AdminOverrides;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateTitle: (animeId: number, newTitle: string) => void;
  updateGlobalStreamUrlTemplate: (source: StreamSource, newUrl: string) => void;
  updateAnimeStreamUrlTemplate: (animeId: number, source: StreamSource, newUrl: string) => void;
  updateEpisodeStreamUrl: (animeId: number, episode: number, source: StreamSource, newUrl: string) => void;
  getStreamUrl: (params: GetStreamUrlParams) => string;
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
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [localOverrides, setLocalOverrides] = useState<AdminOverrides>(getInitialLocalOverrides);
  const { user } = useAuth();

  // Automatically determine admin status based on the globally logged-in user
  useEffect(() => {
    if (user?.isAdmin) {
      setIsAdmin(true);
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } catch {}
    } else {
      setIsAdmin(false);
      setIsAdminMode(false); // Not an admin, so turn off admin mode
      try {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(ADMIN_MODE_KEY);
      } catch {}
    }
  }, [user]);

  const toggleAdminMode = () => {
    setIsAdminMode(prev => {
      const newMode = !prev;
      try {
        localStorage.setItem(ADMIN_MODE_KEY, String(newMode));
      } catch (error) {
        console.error("Failed to save admin mode to localStorage", error);
      }
      return newMode;
    });
  };

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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
        const firebaseUser = await signInWithEmail(email, password);
        if (firebaseUser) {
            const userProfile = await getUserProfile(firebaseUser.uid);
            if (userProfile?.isAdmin) {
                // The useEffect hook will handle setting the `isAdmin` state
                // once the `user` from useAuth() updates.
                return true;
            } else {
                // User logged in but is not an admin. Log them out immediately
                // to prevent them from having a regular user session.
                await firebaseLogout();
                return false;
            }
        }
        return false;
    } catch (error) {
        console.error("Admin login failed:", error);
        return false;
    }
  };

  const logout = () => {
    firebaseLogout();
    // The useEffect hook will handle clearing the `isAdmin` state.
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

  const getStreamUrl = useCallback((params: GetStreamUrlParams): string => {
    const { animeId, malId, episode, source, language, zenshinData, animeFormat, hiAnimeInfo } = params;

    // Priority 1: Episode-specific full URL override
    const episodeOverride = mergedOverrides.anime[animeId]?.episodes?.[episode]?.[source];
    if (episodeOverride && episodeOverride.trim() !== '') {
      return episodeOverride;
    }

    // Special handling for HiAnime
    if (source === StreamSource.HiAnime) {
        if (!hiAnimeInfo || !hiAnimeInfo.episodesList) {
            return 'about:blank#hianime-info-loading';
        }

        const hianimeEpisode = hiAnimeInfo.episodesList.find(ep => ep.number === episode);
        if (!hianimeEpisode) {
            return 'about:blank#hianime-episode-not-found';
        }
        
        const hianimeEpId = hianimeEpisode.episodeId;
        const template = mergedOverrides.anime[animeId]?.streamUrlTemplates?.[source] || mergedOverrides.globalStreamUrlTemplates[source] || STREAM_URLS[source];
        
        const streamLanguage = (language === StreamLanguage.Dub) ? 'dub' : 'sub';

        const streamUrl = template
            .replace('{hianime-ep-id}', String(hianimeEpId))
            .replace('{language}', streamLanguage);
        
        return `https://deno-m3u8-proxy-1.onrender.com/m3u8-proxy?url=${streamUrl}`;
    }

    // Special handling for Vidsrc.icu
    if (source === StreamSource.VidsrcIcu) {
        const dubValue = language === StreamLanguage.Dub ? '1' : '0';
        const template = mergedOverrides.anime[animeId]?.streamUrlTemplates?.[source] || mergedOverrides.globalStreamUrlTemplates[source] || STREAM_URLS[source];
        return template
            .replace('{id}', String(animeId))
            .replace('{episode}', String(episode))
            .replace('{dub}', dubValue);
    }

    // Special handling for Vidsrc
    if (source === StreamSource.Vidsrc) {
        let id = '';
        if (animeId) {
            id = `ani${animeId}`;
        } else if (zenshinData?.mappings?.imdb_id) {
            id = `imdb${zenshinData.mappings.imdb_id}`;
        } else if (malId) {
            id = `${malId}`;
        }

        if (!id) {
            return 'about:blank#vidsrc-id-required';
        }

        let template = mergedOverrides.anime[animeId]?.streamUrlTemplates?.[source] || mergedOverrides.globalStreamUrlTemplates[source] || STREAM_URLS[source];

        // Handle simple base URL templates for Vidsrc
        if (template && !template.includes('{episode}')) {
            template = template.endsWith('/') ? template.slice(0, -1) : template;
            template = `${template}/{episode}/{language}`;
        }
        
        const streamType = language === StreamLanguage.Hindi ? StreamLanguage.Sub : language;
        
        const url = template
            .replace('{id}', id)
            .replace('{episode}', String(episode))
            .replace('{language}', streamType);

        return url;
    }

    // Standard handling for other sources
    const replaceTokens = (template: string) => {
        return template
            .replace('{anilistId}', String(animeId))
            .replace('{malId}', String(malId || zenshinData?.mappings?.mal_id || ''))
            .replace('{episode}', String(episode))
            .replace('{language}', language);
    };

    let url;
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
      url = replaceTokens(animeTemplate);
    } else {
      // Priority 3: Global URL template override
      const globalTemplate = mergedOverrides.globalStreamUrlTemplates[source];
      if (globalTemplate && globalTemplate.trim() !== '') {
        url = replaceTokens(globalTemplate);
      } else {
        // Priority 4: Default hardcoded URL template
        const defaultTemplate = STREAM_URLS[source];
        url = replaceTokens(defaultTemplate);
      }
    }

    return url;
  }, [mergedOverrides]);


  const value = {
    isAdmin,
    isAdminMode,
    toggleAdminMode,
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
    throw new Error('useAdmin must be be used within an AdminProvider');
  }
  return context;
};