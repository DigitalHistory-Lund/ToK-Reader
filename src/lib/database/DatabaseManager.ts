import type { Database, SqlJsStatic } from 'sql.js';
import { config } from '../utils/config';
import { databaseCache } from './DatabaseCache';
import { databaseLoader, type ProgressCallback } from './DatabaseLoader';

/**
 * Database Manager
 * Manages loading, caching, and querying SQLite databases
 * Implements three-layer caching: memory -> IndexedDB -> network
 */
export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private SQL: SqlJsStatic | null = null;
  private memoryCache: Map<number, Database> = new Map();
  private loadingPromises: Map<number, Promise<Database>> = new Map();
  private lruQueue: number[] = []; // Least Recently Used queue

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize sql.js library
   */
  private async initSqlJs(): Promise<void> {
    if (this.SQL) return;

    // Load sql.js from CDN to avoid Vite bundling issues
    // @ts-ignore - loaded from global scope
    if (!window.initSqlJs) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/sql-wasm.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // @ts-ignore - initSqlJs is loaded from CDN
    const initSqlJs = window.initSqlJs;

    this.SQL = await initSqlJs({
      locateFile: (file: string) => {
        if (file.endsWith('.wasm')) {
          return 'https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/sql-wasm.wasm';
        }
        return file;
      },
    });
  }

  /**
   * Update LRU queue
   * @param year Year that was accessed
   */
  private updateLRU(year: number): void {
    // Remove year if it exists
    const index = this.lruQueue.indexOf(year);
    if (index > -1) {
      this.lruQueue.splice(index, 1);
    }

    // Add to end (most recently used)
    this.lruQueue.push(year);

    // Evict if over limit
    while (
      this.lruQueue.length > config.maxCachedDatabases &&
      this.lruQueue.length > 0
    ) {
      const yearToEvict = this.lruQueue.shift();
      if (yearToEvict !== undefined) {
        const db = this.memoryCache.get(yearToEvict);
        if (db) {
          db.close();
          this.memoryCache.delete(yearToEvict);
        }
      }
    }
  }

  /**
   * Load a database by year
   * @param year Year of the database
   * @param onProgress Optional progress callback
   * @returns Database instance
   */
  async loadDatabase(
    year: number,
    onProgress?: ProgressCallback
  ): Promise<Database> {
    // Check memory cache first
    const cached = this.memoryCache.get(year);
    if (cached) {
      this.updateLRU(year);
      return cached;
    }

    // Check if already loading
    const loadingPromise = this.loadingPromises.get(year);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Start loading
    const promise = this._loadDatabaseInternal(year, onProgress);
    this.loadingPromises.set(year, promise);

    try {
      const db = await promise;
      this.loadingPromises.delete(year);
      return db;
    } catch (error) {
      this.loadingPromises.delete(year);
      throw error;
    }
  }

  /**
   * Internal database loading logic
   * @param year Year of the database
   * @param onProgress Optional progress callback
   * @returns Database instance
   */
  private async _loadDatabaseInternal(
    year: number,
    onProgress?: ProgressCallback
  ): Promise<Database> {
    await this.initSqlJs();

    if (!this.SQL) {
      throw new Error('Failed to initialize sql.js');
    }

    let data: Uint8Array | null = null;

    // Try IndexedDB cache
    data = await databaseCache.get(year);

    if (data) {
      console.log(`Loaded database for year ${year} from IndexedDB cache`);
    } else {
      // Fetch from network
      console.log(`Fetching database for year ${year} from network`);
      data = await databaseLoader.fetchDatabase(year, onProgress);

      // Cache in IndexedDB for next time
      try {
        await databaseCache.set(year, data);
        console.log(`Cached database for year ${year} in IndexedDB`);
      } catch (error) {
        console.warn(`Failed to cache database for year ${year}:`, error);
        // Continue anyway
      }
    }

    // Initialize database
    const db = new this.SQL.Database(data);

    // Store in memory cache
    this.memoryCache.set(year, db);
    this.updateLRU(year);

    return db;
  }

  /**
   * Execute a query on a database
   * @param year Year of the database
   * @param sql SQL query string
   * @param params Optional query parameters
   * @returns Query results
   */
  async executeQuery(
    year: number,
    sql: string,
    params?: any[]
  ): Promise<any[]> {
    const db = await this.loadDatabase(year);

    try {
      const results = db.exec(sql, params);

      if (results.length === 0) {
        return [];
      }

      // Convert to array of objects
      const columns = results[0].columns;
      const values = results[0].values;

      return values.map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col: string, index: number) => {
          obj[col] = row[index];
        });
        return obj;
      });
    } catch (error) {
      throw new Error(
        `Query execution failed for year ${year}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Check if a database is loaded in memory
   * @param year Year of the database
   * @returns true if loaded in memory
   */
  isLoaded(year: number): boolean {
    return this.memoryCache.has(year);
  }

  /**
   * Get loaded database directly (throws if not loaded)
   * @param year Year of the database
   * @returns Database instance
   */
  getLoadedDatabase(year: number): Database {
    const db = this.memoryCache.get(year);
    if (!db) {
      throw new Error(`Database for year ${year} is not loaded`);
    }
    return db;
  }

  /**
   * Clear cache
   * @param year Optional specific year to clear, or all if not provided
   */
  async clearCache(year?: number): Promise<void> {
    if (year !== undefined) {
      // Clear specific year
      const db = this.memoryCache.get(year);
      if (db) {
        db.close();
        this.memoryCache.delete(year);
      }

      const lruIndex = this.lruQueue.indexOf(year);
      if (lruIndex > -1) {
        this.lruQueue.splice(lruIndex, 1);
      }

      await databaseCache.delete(year);
    } else {
      // Clear all
      for (const db of this.memoryCache.values()) {
        db.close();
      }
      this.memoryCache.clear();
      this.lruQueue = [];

      await databaseCache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns Cache stats
   */
  async getCacheStats(): Promise<{
    memoryCount: number;
    cachedYears: number[];
    cacheSize: number;
  }> {
    const cachedYears = await databaseCache.getCachedYears();
    const cacheSize = await databaseCache.getCacheSize();

    return {
      memoryCount: this.memoryCache.size,
      cachedYears,
      cacheSize,
    };
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();
