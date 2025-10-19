// services/dbService.ts
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'AniGloK-DB';
const DB_VERSION = 1;
const STORE_NAME = 'apiCache';

interface CacheEntry<T> {
  key: string;
  data: T;
  expiresAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function set<T>(key: string, data: T, maxAgeMs: number): Promise<void> {
  try {
    const db = await getDb();
    const entry: CacheEntry<T> = {
      key,
      data,
      expiresAt: Date.now() + maxAgeMs,
    };
    await db.put(STORE_NAME, entry);
  } catch (error) {
    console.error(`IndexedDB: Failed to set key "${key}"`, error);
  }
}

export async function get<T>(key: string): Promise<T | null> {
  try {
    const db = await getDb();
    const entry: CacheEntry<T> | undefined = await db.get(STORE_NAME, key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      // Data is expired, don't return it for a normal get.
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error(`IndexedDB: Failed to get key "${key}"`, error);
    return null;
  }
}

export async function getStale<T>(key: string): Promise<T | null> {
    try {
        const db = await getDb();
        const entry: CacheEntry<T> | undefined = await db.get(STORE_NAME, key);
        return entry ? entry.data : null;
    } catch (error) {
        console.error(`IndexedDB: Failed to get stale key "${key}"`, error);
        return null;
    }
}

// Periodically clean up expired items
export async function cleanup(): Promise<void> {
    try {
        const db = await getDb();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('expiresAt');
        
        const now = Date.now();
        let cursor = await index.openCursor(IDBKeyRange.upperBound(now));
        
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }
        
        await tx.done;
        console.log('IndexedDB: Cleanup complete.');
    } catch (error) {
        console.error('IndexedDB: Cleanup failed.', error);
    }
}

// Run cleanup once on app load
cleanup();
