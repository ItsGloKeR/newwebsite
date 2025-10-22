import { MediaProgress, PlayerEventCallback, MediaProgressEntry, Anime } from '../types';
import { updateUserProgress } from '../services/firebaseService';

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
    if (event.origin !== 'https://vidnest.fun' && event.origin !== 'https://vidlink.pro') {
      return;
    }

    if (event.data?.type === 'MEDIA_DATA') {
      const newMediaData: MediaProgress = event.data.data;
      const currentProgress = this.getAllMediaData();

      let hasChanged = false;
      for (const anilistId in newMediaData) {
        if (Object.prototype.hasOwnProperty.call(newMediaData, anilistId)) {
          hasChanged = true;
          const newEntry = newMediaData[anilistId];
          const existingEntry = currentProgress[anilistId];
          currentProgress[anilistId] = {
            ...newEntry,
            lastAccessed: existingEntry?.lastAccessed || Date.now(),
          };
        }
      }
      
      if (hasChanged) {
        this.saveProgress(currentProgress);
        if (this.userId) {
          updateUserProgress(this.userId, currentProgress);
        }
      }
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

  public addToHistory(anime: Anime) {
    const allData = this.getAllMediaData();
    const existingEntry = allData[anime.anilistId];

    const newEntry: MediaProgressEntry = {
      id: anime.anilistId,
      type: 'tv',
      title: anime.englishTitle,
      poster_path: anime.coverImage,
      progress: existingEntry?.progress || { watched: 0, duration: 0 },
      last_season_watched: existingEntry?.last_season_watched || '1',
      last_episode_watched: existingEntry?.last_episode_watched || '1',
      show_progress: existingEntry?.show_progress || {},
      lastAccessed: Date.now(),
    };

    allData[anime.anilistId] = newEntry;
    this.saveProgress(allData);
    if (this.userId) {
      updateUserProgress(this.userId, { [anime.anilistId]: newEntry });
    }
  }

  public removeFromHistory(anilistId: number) {
    const allData = this.getAllMediaData();
    if (allData[anilistId]) {
      delete allData[anilistId];
      this.saveProgress(allData);
      if (this.userId) {
        // To remove a field in firestore, we would need a specific function
        // For now, we sync the whole progress object which will remove it.
        // A more optimized way is to use FieldValue.delete()
        updateUserProgress(this.userId, allData);
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
    return this.getAllMediaData()[anilistId] || null;
  }
  
  public getResumeTime(anilistId: number, episode: number): number | null {
    const mediaData = this.getMediaData(anilistId);
    if (!mediaData) return null;

    const episodeProgress = mediaData.show_progress?.[`s1e${episode}`];
    
    if (episodeProgress?.progress?.watched && episodeProgress?.progress?.duration) {
        if (episodeProgress.progress.duration - episodeProgress.progress.watched < 15) {
            return null;
        }
        return Math.floor(episodeProgress.progress.watched);
    }

    return null;
  }
}

export const progressTracker = new ProgressTracker();
