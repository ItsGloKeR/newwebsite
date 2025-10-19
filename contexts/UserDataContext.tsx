import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

const WATCHLIST_STORAGE_KEY = 'aniGlokWatchlist';
const FAVORITES_STORAGE_KEY = 'aniGlokFavorites';

interface UserDataContextType {
  watchlist: number[];
  favorites: number[];
  toggleWatchlist: (animeId: number) => void;
  toggleFavorite: (animeId: number) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const getFromStorage = (key: string): number[] => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage`, error);
    return [];
  }
};

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<number[]>(() => getFromStorage(WATCHLIST_STORAGE_KEY));
  const [favorites, setFavorites] = useState<number[]>(() => getFromStorage(FAVORITES_STORAGE_KEY));

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    } catch (error) {
      console.error("Failed to save watchlist to localStorage", error);
    }
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("Failed to save favorites to localStorage", error);
    }
  }, [favorites]);

  const toggleWatchlist = useCallback((animeId: number) => {
    setWatchlist(prev => 
      prev.includes(animeId) 
        ? prev.filter(id => id !== animeId) 
        : [...prev, animeId]
    );
  }, []);

  const toggleFavorite = useCallback((animeId: number) => {
    setFavorites(prev =>
      prev.includes(animeId)
        ? prev.filter(id => id !== animeId)
        : [...prev, animeId]
    );
  }, []);

  const value = {
    watchlist,
    favorites,
    toggleWatchlist,
    toggleFavorite,
  };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
};

export const useUserData = (): UserDataContextType => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};