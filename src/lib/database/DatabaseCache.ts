import { openDB, type IDBPDatabase } from 'idb';
import { config } from '../utils/config';
import type { DatabaseCacheEntry } from '@/types/database';

/**
 * Database Cache using IndexedDB
 * Provides persistent storage for database files across sessions
 */
export class DatabaseCache {
  private db: IDBPDatabase | null = null;
  private readonly dbName = config.cacheDbName;
  private readonly storeName = config.cacheStoreName;
  private readonly version = 1;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB(this.dbName, this.version, {
      upgrade(db) {
        // Create object store for databases
        if (!db.objectStoreNames.contains(config.cacheStoreName)) {
          const store = db.createObjectStore(config.cacheStoreName, {
            keyPath: 'year',
          });
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }

  /**
   * Get a cached database by year
   * @param year Year of the database
   * @returns Cached database data or null if not found
   */
  async get(year: number): Promise<Uint8Array | null> {
    await this.init();

    if (!this.db) return null;

    try {
      const entry: DatabaseCacheEntry | undefined = await this.db.get(
        this.storeName,
        year
      );

      if (!entry) return null;

      // Check if cache is still valid (version matches)
      if (entry.version !== config.cacheVersion) {
        await this.delete(year);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`Failed to get cached database for year ${year}:`, error);
      return null;
    }
  }

  /**
   * Store a database in the cache
   * @param year Year of the database
   * @param data Database data
   */
  async set(year: number, data: Uint8Array): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('Database cache not initialized');
    }

    try {
      const entry: DatabaseCacheEntry = {
        year,
        data,
        timestamp: Date.now(),
        version: config.cacheVersion,
      };

      await this.db.put(this.storeName, entry);
    } catch (error) {
      console.error(`Failed to cache database for year ${year}:`, error);
      throw error;
    }
  }

  /**
   * Delete a cached database
   * @param year Year of the database to delete
   */
  async delete(year: number): Promise<void> {
    await this.init();

    if (!this.db) return;

    try {
      await this.db.delete(this.storeName, year);
    } catch (error) {
      console.error(`Failed to delete cached database for year ${year}:`, error);
    }
  }

  /**
   * Clear all cached databases
   */
  async clear(): Promise<void> {
    await this.init();

    if (!this.db) return;

    try {
      await this.db.clear(this.storeName);
    } catch (error) {
      console.error('Failed to clear database cache:', error);
    }
  }

  /**
   * Get all cached years
   * @returns Array of cached years
   */
  async getCachedYears(): Promise<number[]> {
    await this.init();

    if (!this.db) return [];

    try {
      const keys = await this.db.getAllKeys(this.storeName);
      return keys as number[];
    } catch (error) {
      console.error('Failed to get cached years:', error);
      return [];
    }
  }

  /**
   * Get cache size in bytes
   * @returns Total size of cached databases
   */
  async getCacheSize(): Promise<number> {
    await this.init();

    if (!this.db) return 0;

    try {
      const entries: DatabaseCacheEntry[] = await this.db.getAll(this.storeName);
      return entries.reduce((total, entry) => total + entry.data.byteLength, 0);
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }
}

// Singleton instance
export const databaseCache = new DatabaseCache();
