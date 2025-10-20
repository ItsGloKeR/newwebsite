import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserData, updateUserData, mergeLocalDataToFirestore } from '../services/firebase';

const WATCHLIST_STORAGE_KEY = 'aniGlokWatchlist';
const FAVORITES_STORAGE_KEY = 'aniGlokFavorites';

interface UserDataContextType {
  watchlist: number[];
  favorites: number[];
  toggleWatchlist: (animeId: number) => void;
  toggleFavorite: (animeId: number) => void;
  isLoading: boolean;
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
  const { user, loading: authLoading } = useAuth();
  const [watchlist, setWatchlist] = useState<number[]>(() => getFromStorage(WATCHLIST_STORAGE_KEY));
  const [favorites, setFavorites] = useState<number[]>(() => getFromStorage(FAVORITES_STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Effect to load data on user change
  useEffect(() => {
    if (authLoading) return; // Wait for auth state to be resolved

    const loadUserData = async () => {
      setIsLoading(true);
      if (user) {
        // User is logged in, sync with Firestore
        const localWatchlist = getFromStorage(WATCHLIST_STORAGE_KEY);
        const localFavorites = getFromStorage(FAVORITES_STORAGE_KEY);

        if (localWatchlist.length > 0 || localFavorites.length > 0) {
            // Merge local data if it exists
            const mergedData = await mergeLocalDataToFirestore(user.uid, {
                watchlist: localWatchlist,
                favorites: localFavorites
            });
            setWatchlist(mergedData.watchlist);
            setFavorites(mergedData.favorites);
            // Clear local storage after successful merge
            localStorage.removeItem(WATCHLIST_STORAGE_KEY);
            localStorage.removeItem(FAVORITES_STORAGE_KEY);
        } else {
            // No local data, just fetch from Firestore
            const firestoreData = await getUserData(user.uid);
            setWatchlist(firestoreData?.watchlist || []);
            setFavorites(firestoreData?.favorites || []);
        }
      } else {
        // User is logged out, load from localStorage
        setWatchlist(getFromStorage(WATCHLIST_STORAGE_KEY));
        setFavorites(getFromStorage(FAVORITES_STORAGE_KEY));
      }
      setIsLoading(false);
    };

    loadUserData();
  }, [user, authLoading]);


  const toggleWatchlist = useCallback((animeId: number) => {
    setWatchlist(prev => {
      const newList = prev.includes(animeId) 
        ? prev.filter(id => id !== animeId) 
        : [...prev, animeId];
      
      if (user) {
        updateUserData(user.uid, { watchlist: newList });
      } else {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newList));
      }
      return newList;
    });
  }, [user]);

  const toggleFavorite = useCallback((animeId: number) => {
    setFavorites(prev => {
      const newList = prev.includes(animeId)
        ? prev.filter(id => id !== animeId)
        : [...prev, animeId];
        
      if (user) {
        updateUserData(user.uid, { favorites: newList });
      } else {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newList));
      }
      return newList;
    });
  }, [user]);

  const value = {
    watchlist,
    favorites,
    toggleWatchlist,
    toggleFavorite,
    isLoading,
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
