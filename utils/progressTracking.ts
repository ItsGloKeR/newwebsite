import { MediaProgress, PlayerEventCallback, MediaProgressEntry, Anime } from '../types';
import { updateUserProgress } from '../services/firebaseService';

const PROGRESS_STORAGE_KEY = 'vidLinkProgress';

class ProgressTracker {
  private listeners: Set<PlayerEventCallback> = new Set();
  private isInitialized = false;
  private userId: string | null = null;
  private debounceTimeout: number | null = null;
  private pendingProgressUpdates: MediaProgress = {};

  public init() {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('message', this.handleMessage.bind(this));
    this.isInitialized = true;
  }

  public setUserId(userId: string | null) {
    this.userId = userId;
    if (!userId && this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.pendingProgressUpdates = {};
    }
  }

  private scheduleProgressUpdate() {
    if (!this.userId) return;

    if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = window.setTimeout(() => {
        if (this.userId && Object.keys(this.pendingProgressUpdates).length > 0) {
            console.log('Debouncing progress update to Firestore.');
            updateUserProgress(this.userId, this.pendingProgressUpdates);
            this.pendingProgressUpdates = {}; // Clear after sending
        }
    }, 15000); // 15-second debounce
  }

  private handleMessage(event: MessageEvent) {
    // We no longer listen for MEDIA_DATA to reduce writes.
    // This listener is now only for other player events like video controls.
    if (event.origin !== 'https://vidnest.fun' && event.origin !== 'https://vidlink.pro' && event.origin !== 'https://vidsrc.cc') {
      return;
    }
    
    if (event.data?.type === 'PLAYER_EVENT') {
      this.listeners.forEach(callback => callback(event.data.data));
    }
  }

  private saveProgress(progress: MediaProgress) {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
      window.dispatchEvent(new CustomEvent('progressUpdated'));
  }
  
  public replaceAllProgress(progress: MediaProgress) {
    this.saveProgress(progress);
  }

  public setLastWatchedEpisode(anime: Anime, episode: number) {
    const allData = this.getAllMediaData();
    const animeIdString = String(anime.anilistId);

    const entry: MediaProgressEntry = allData[animeIdString] || {
      id: anime.anilistId,
      type: anime.format === 'MOVIE' ? 'movie' : 'tv',
      title: anime.englishTitle,
      poster_path: anime.coverImage,
      last_episode_watched: 0,
    };

    // To avoid excessive writes, only update if the episode is different or if it's been a while.
    if (entry.last_episode_watched === episode && entry.lastAccessed && (Date.now() - entry.lastAccessed < 60000)) {
        return;
    }

    entry.last_episode_watched = episode;
    entry.lastAccessed = Date.now();
    
    allData[animeIdString] = entry;
    this.saveProgress(allData);

    if (this.userId) {
      this.pendingProgressUpdates[animeIdString] = entry;
      this.scheduleProgressUpdate();
    }
  }

  public addToHistory(anime: Anime) {
    const allData = this.getAllMediaData();
    const animeIdString = String(anime.anilistId);
    const existingEntry = allData[animeIdString];

    if (!existingEntry) {
        const newEntry: MediaProgressEntry = {
            id: anime.anilistId,
            type: anime.format === 'MOVIE' ? 'movie' : 'tv',
            title: anime.englishTitle,
            poster_path: anime.coverImage,
            last_episode_watched: 1,
            lastAccessed: Date.now(),
        };

        allData[animeIdString] = newEntry;
        this.saveProgress(allData);

        if (this.userId) {
            this.pendingProgressUpdates[animeIdString] = newEntry;
            this.scheduleProgressUpdate();
        }
    } else {
        // If it exists, update lastAccessed to bring it to the front of "continue watching"
        existingEntry.lastAccessed = Date.now();
        allData[animeIdString] = existingEntry;
        this.saveProgress(allData);

        if (this.userId) {
            this.pendingProgressUpdates[animeIdString] = existingEntry;
            this.scheduleProgressUpdate();
        }
    }
  }

  public removeFromHistory(anilistId: number) {
    const allData = this.getAllMediaData();
    const anilistIdString = String(anilistId);
    if (allData[anilistIdString]) {
      delete allData[anilistIdString];
      this.saveProgress(allData);
      
      if (this.userId) {
        // Use null as a signal for deletion in the batched update
        this.pendingProgressUpdates[anilistIdString] = null as any;
        this.scheduleProgressUpdate();
      }
    }
  }

  public addEventListener(callback: PlayerEventCallback) {
    this.listeners.add(callback);
  }

  public removeEventListener(callback: PlayerEventCallback) {
    this.listeners.delete(callback);
  }

  public getAllMediaData(): MediaProgress {
    try {
      const data = localStorage.getItem(PROGRESS_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to parse progress data:', error);
      return {};
    }
  }

  public getMediaData(anilistId: number): MediaProgressEntry | null {
    return this.getAllMediaData()[String(anilistId)] || null;
  }
}

export const progressTracker = new ProgressTracker();