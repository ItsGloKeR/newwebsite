// This service now only handles non-API, simple key-value storage like search history.
// API caching is handled by dbService.ts using IndexedDB.

const SEARCH_HISTORY_KEY = 'aniGlokSearchHistory';
const MAX_HISTORY_ITEMS = 10;

/**
 * Retrieves the user's search history from localStorage.
 * @returns An array of search terms.
 */
export function getSearchHistory(): string[] {
  try {
    const historyStr = localStorage.getItem(SEARCH_HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr) : [];
  } catch (error) {
    console.error('Error getting search history from cache:', error);
    return [];
  }
}

/**
 * Adds a search term to the user's history.
 * Handles duplicates and maintains a maximum history size.
 * @param term The search term to add.
 */
export function addSearchTermToHistory(term: string): void {
  if (!term || term.trim() === '') return;
  try {
    let history = getSearchHistory();
    // Remove existing instance to move it to the front
    history = history.filter(t => t.toLowerCase() !== term.toLowerCase());
    // Add new term to the beginning
    history.unshift(term);
    // Trim to max size
    history = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error(`Error adding search term "${term}" to history:`, error);
  }
}

/**
 * Removes a specific search term from the history.
 * @param term The search term to remove.
 */
export function removeSearchTermFromHistory(term: string): void {
  try {
    let history = getSearchHistory();
    history = history.filter(t => t.toLowerCase() !== term.toLowerCase());
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error(`Error removing search term "${term}" from history:`, error);
  }
}

/**
 * Clears the entire search history.
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}
