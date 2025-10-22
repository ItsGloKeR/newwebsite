import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserData, updateUserData } from '../services/firebaseService';

const WATCHLIST_STORAGE_KEY = 'aniGlokWatchlist';
const FAVORITES_STORAGE_KEY = 'aniGlokFavorites';

interface UserDataContextType {
  watchlist: number[];
  favorites: number[];
  toggleWatchlist: (animeId: number) => void;
  toggleFavorite: (animeId: number) => void;
  reSync: () => void;
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

const saveToStorage = (key: string, data: number[]) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to save ${key} to localStorage`, error);
    }
}

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<number[]>(() => getFromStorage(WATCHLIST_STORAGE_KEY));
  const [favorites, setFavorites] = useState<number[]>(() => getFromStorage(FAVORITES_STORAGE_KEY));
  const [isSynced, setIsSynced] = useState(false);

  const syncData = useCallback(async () => {
    if (user && !isSynced) {
        setIsSynced(true); // Attempt sync only once per login
        try {
            const userData = await getUserData(user.uid);
            
            const remoteWatchlist = userData?.watchlist;
            const remoteFavorites = userData?.favorites;

            if (remoteWatchlist !== undefined && remoteFavorites !== undefined) {
                // Remote data exists, this is the source of truth.
                setWatchlist(remoteWatchlist);
                setFavorites(remoteFavorites);
                saveToStorage(WATCHLIST_STORAGE_KEY, remoteWatchlist);
                saveToStorage(FAVORITES_STORAGE_KEY, remoteFavorites);
            } else {
                // No remote data, so this is likely a new user. Upload local guest data if it exists.
                const localWatchlist = getFromStorage(WATCHLIST_STORAGE_KEY);
                const localFavorites = getFromStorage(FAVORITES_STORAGE_KEY);
                if (localWatchlist.length > 0 || localFavorites.length > 0) {
                    await updateUserData(user.uid, { watchlist: localWatchlist, favorites: localFavorites });
                }
            }
        } catch (error) {
            console.error("Error during user data sync. Using local data as fallback.", error);
            // If sync fails, the context will continue to use the data loaded from localStorage.
        }
    } else if (!user) {
        // When user logs out, revert to local storage and reset sync status.
        setWatchlist(getFromStorage(WATCHLIST_STORAGE_KEY));
        setFavorites(getFromStorage(FAVORITES_STORAGE_KEY));
        setIsSynced(false);
    }
}, [user, isSynced]);


  useEffect(() => {
    syncData();
  }, [user, syncData]);

  const toggleWatchlist = useCallback(async (animeId: number) => {
    const newWatchlist = watchlist.includes(animeId)
      ? watchlist.filter(id => id !== animeId)
      : [...watchlist, animeId];
    
    setWatchlist(newWatchlist);
    saveToStorage(WATCHLIST_STORAGE_KEY, newWatchlist);

    if (user) {
      await updateUserData(user.uid, { watchlist: newWatchlist });
    }
  }, [watchlist, user]);

  const toggleFavorite = useCallback(async (animeId: number) => {
    const newFavorites = favorites.includes(animeId)
      ? favorites.filter(id => id !== animeId)
      : [...favorites, animeId];
    
    setFavorites(newFavorites);
    saveToStorage(FAVORITES_STORAGE_KEY, newFavorites);

    if (user) {
      await updateUserData(user.uid, { favorites: newFavorites });
    }
  }, [favorites, user]);
  
  const reSync = useCallback(() => {
    setIsSynced(false);
    // syncData will be called by the useEffect when isSynced changes to false.
  }, []);

  const value = {
    watchlist,
    favorites,
    toggleWatchlist,
    toggleFavorite,
    reSync,
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