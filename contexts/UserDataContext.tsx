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

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<number[]>(() => getFromStorage(WATCHLIST_STORAGE_KEY));
  const [favorites, setFavorites] = useState<number[]>(() => getFromStorage(FAVORITES_STORAGE_KEY));
  const [isSynced, setIsSynced] = useState(false);

  const syncData = useCallback(async () => {
    if (user && !isSynced) {
        const localWatchlist = getFromStorage(WATCHLIST_STORAGE_KEY);
        const localFavorites = getFromStorage(FAVORITES_STORAGE_KEY);
        
        try {
            const userData = await getUserData(user.uid);
            
            const firestoreWatchlist = userData?.watchlist || [];
            const firestoreFavorites = userData?.favorites || [];

            const hasLocalDataToMerge = localWatchlist.length > 0 || localFavorites.length > 0;

            if (hasLocalDataToMerge) {
                const mergedWatchlist = Array.from(new Set([...firestoreWatchlist, ...localWatchlist]));
                const mergedFavorites = Array.from(new Set([...firestoreFavorites, ...localFavorites]));
                
                setWatchlist(mergedWatchlist);
                setFavorites(mergedFavorites);
                
                await updateUserData(user.uid, { watchlist: mergedWatchlist, favorites: mergedFavorites });
                
                // Clear local data ONLY after successful sync
                localStorage.removeItem(WATCHLIST_STORAGE_KEY);
                localStorage.removeItem(FAVORITES_STORAGE_KEY);
            } else {
                setWatchlist(firestoreWatchlist);
                setFavorites(firestoreFavorites);
            }
            // Set synced flag only after all operations complete successfully
            setIsSynced(true);
        } catch (error) {
            console.error("Error during user data sync, falling back to local data if available.", error);
            // If sync fails, fall back to whatever is local and do NOT set isSynced to true,
            // allowing the sync to be re-attempted on the next render.
            setWatchlist(localWatchlist);
            setFavorites(localFavorites);
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

    if (user) {
      await updateUserData(user.uid, { watchlist: newWatchlist });
    } else {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
    }
  }, [watchlist, user]);

  const toggleFavorite = useCallback(async (animeId: number) => {
    const newFavorites = favorites.includes(animeId)
      ? favorites.filter(id => id !== animeId)
      : [...favorites, animeId];
    setFavorites(newFavorites);

    if (user) {
      await updateUserData(user.uid, { favorites: newFavorites });
    } else {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    }
  }, [favorites, user]);
  
  const reSync = useCallback(() => {
    setIsSynced(false);
    syncData();
  }, [syncData]);

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