import { MediaProgress, PlayerEventCallback, MediaProgressEntry, Anime } from '../types';
import { updateUserProgress, removeProgressForAnime } from '../services/firebaseService';

const PROGRESS_STORAGE_KEY = 'vidLinkProgress';

class ProgressTracker {
  private listeners: Set<PlayerEventCallback> = new Set();
  private isInitialized = false;
  private userId: string | null = null;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('message', this.handleMessage.bind(this));
    this.isInitialized = true;
  }

  public setUserId(userId: string | null) {
    this.userId = userId;
  }

  private handleMessage(event: MessageEvent) {
    // We no longer listen for MEDIA_DATA to reduce writes.
    // This listener is now only for other player events like video controls.
    if (event.origin !== 'https://vidnest.fun' && event.origin !== 'https://vidlink.pro') {
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

    // FIX: Ensure new entry conforms to MediaProgressEntry and use string keys for object access to match MediaProgress type.
    const entry: MediaProgressEntry = allData[animeIdString] || {
      id: anime.anilistId,
      type: anime.format === 'MOVIE' ? 'movie' : 'tv',
      title: anime.englishTitle,
      poster_path: anime.coverImage,
      last_episode_watched: 0, // Provide default to satisfy the type.
    };

    entry.last_episode_watched = episode;
    entry.lastAccessed = Date.now();
    
    allData[animeIdString] = entry;
    this.saveProgress(allData);

    if (this.userId) {
      updateUserProgress(this.userId, { [animeIdString]: entry });
    }
  }

  public addToHistory(anime: Anime) {
    const allData = this.getAllMediaData();
    const existingEntry = allData[String(anime.anilistId)];

    // Only add if it doesn't exist. Don't overwrite last_episode_watched.
    if (!existingEntry) {
        const newEntry: MediaProgressEntry = {
            id: anime.anilistId,
            type: anime.format === 'MOVIE' ? 'movie' : 'tv',
            title: anime.englishTitle,
            poster_path: anime.coverImage,
            last_episode_watched: 1,
            lastAccessed: Date.now(),
        };

        allData[String(anime.anilistId)] = newEntry;
        this.saveProgress(allData);

        if (this.userId) {
            updateUserProgress(this.userId, { [String(anime.anilistId)]: newEntry });
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
        removeProgressForAnime(this.userId, anilistId);
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
