
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getUserData, updateUserData } from '../services/firebaseService';
import { UserProfile } from '../types';

const WATCHLIST_STORAGE_KEY = 'aniGlokWatchlist';
const FAVORITES_STORAGE_KEY = 'aniGlokFavorites';

interface UserDataContextType {
  watchlist: number[];
  favorites: number[];
  toggleWatchlist: (animeId: number) => void;
  toggleFavorite: (animeId: number) => void;
  reSync: (user: UserProfile) => void;
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
  const debounceTimeoutRef = useRef<number | null>(null);

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

  const scheduleFirestoreUpdate = useCallback(() => {
    if (!user) return;

    if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = window.setTimeout(() => {
        const latestWatchlist = getFromStorage(WATCHLIST_STORAGE_KEY);
        const latestFavorites = getFromStorage(FAVORITES_STORAGE_KEY);
        console.log('Debouncing user data update to Firestore.');
        updateUserData(user.uid, { 
            watchlist: latestWatchlist, 
            favorites: latestFavorites 
        });
    }, 5000); // 5-second debounce
  }, [user]);

  const toggleWatchlist = useCallback((animeId: number) => {
    setWatchlist(currentWatchlist => {
        const newWatchlist = currentWatchlist.includes(animeId)
            ? currentWatchlist.filter(id => id !== animeId)
            : [...currentWatchlist, animeId];
        
        saveToStorage(WATCHLIST_STORAGE_KEY, newWatchlist);
        if (user) {
            scheduleFirestoreUpdate();
        }
        return newWatchlist;
    });
  }, [user, scheduleFirestoreUpdate]);

  const toggleFavorite = useCallback((animeId: number) => {
    setFavorites(currentFavorites => {
        const newFavorites = currentFavorites.includes(animeId)
            ? currentFavorites.filter(id => id !== animeId)
            : [...currentFavorites, animeId];

        saveToStorage(FAVORITES_STORAGE_KEY, newFavorites);
        if (user) {
            scheduleFirestoreUpdate();
        }
        return newFavorites;
    });
  }, [user, scheduleFirestoreUpdate]);
  
  const reSync = useCallback((_user: UserProfile) => {
    setIsSynced(false);
    // syncData will be called by the useEffect when isSynced changes to false.
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
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
