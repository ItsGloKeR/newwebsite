import { MediaProgress, PlayerEventCallback, MediaProgressEntry } from '../types';

const PROGRESS_STORAGE_KEY = 'vidLinkProgress';

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
    if (event.origin !== 'https://vidnest.fun') {
      return;
    }

    if (event.data?.type === 'MEDIA_DATA') {
      const mediaData = event.data.data;
      const currentProgress = this.getAllMediaData();
      const updatedProgress = { ...currentProgress, ...mediaData };
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(updatedProgress));
      
      window.dispatchEvent(new CustomEvent('progressUpdated'));
    }

    if (event.data?.type === 'PLAYER_EVENT') {
      this.listeners.forEach(callback => callback(event.data.data));
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
