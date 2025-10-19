import { MediaProgress, PlayerEventCallback, MediaProgressEntry, Anime } from '../types';

const PROGRESS_STORAGE_key = 'vidLinkProgress';

class ProgressTracker {
  private listeners: Set<PlayerEventCallback> = new Set();
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('message', this.handleMessage.bind(this));
    this.isInitialized = true;
  }

  private handleMessage(event: MessageEvent) {
    if (event.origin !== 'https://vidnest.fun' && event.origin !== 'https://vidlink.pro') {
      return;
    }

    if (event.data?.type === 'MEDIA_DATA') {
      const newMediaData: MediaProgress = event.data.data;
      const currentProgress = this.getAllMediaData();

      // Merge new data, preserving lastAccessed
      for (const anilistId in newMediaData) {
        if (Object.prototype.hasOwnProperty.call(newMediaData, anilistId)) {
          const newEntry = newMediaData[anilistId];
          const existingEntry = currentProgress[anilistId];
          // Preserve the lastAccessed timestamp if it exists on the old entry
          currentProgress[anilistId] = {
            ...newEntry,
            lastAccessed: existingEntry?.lastAccessed || Date.now(),
          };
        }
      }
      
      localStorage.setItem(PROGRESS_STORAGE_key, JSON.stringify(currentProgress));
      window.dispatchEvent(new CustomEvent('progressUpdated'));
    }

    if (event.data?.type === 'PLAYER_EVENT') {
      this.listeners.forEach(callback => callback(event.data.data));
    }
  }

  public addToHistory(anime: Anime) {
    const allData = this.getAllMediaData();
    const existingEntry = allData[anime.anilistId];

    const newEntry: MediaProgressEntry = {
      id: anime.anilistId,
      type: 'tv',
      // FIX: Use englishTitle as 'title' does not exist on the Anime type.
      title: anime.englishTitle,
      poster_path: anime.coverImage,
      progress: existingEntry?.progress || { watched: 0, duration: 0 },
      last_season_watched: existingEntry?.last_season_watched || '1',
      last_episode_watched: existingEntry?.last_episode_watched || '1',
      show_progress: existingEntry?.show_progress || {},
      lastAccessed: Date.now(),
    };

    allData[anime.anilistId] = newEntry;
    localStorage.setItem(PROGRESS_STORAGE_key, JSON.stringify(allData));
    window.dispatchEvent(new CustomEvent('progressUpdated'));
  }

  public removeFromHistory(anilistId: number) {
    const allData = this.getAllMediaData();
    if (allData[anilistId]) {
      delete allData[anilistId];
      localStorage.setItem(PROGRESS_STORAGE_key, JSON.stringify(allData));
      window.dispatchEvent(new CustomEvent('progressUpdated'));
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
      const data = localStorage.getItem(PROGRESS_STORAGE_key);
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

    // Assuming season 1 as the app doesn't manage seasons in the player.
    const episodeProgress = mediaData.show_progress?.[`s1e${episode}`];
    
    if (episodeProgress?.progress?.watched && episodeProgress?.progress?.duration) {
        // Don't resume if watched is very close to the end (e.g., last 15 seconds)
        if (episodeProgress.progress.duration - episodeProgress.progress.watched < 15) {
            return null;
        }
        return Math.floor(episodeProgress.progress.watched);
    }

    return null;
  }
}

export const progressTracker = new ProgressTracker();