import React, { createContext, useContext, useState, useCallback } from 'react';
import { databaseManager } from '@/lib/database/DatabaseManager';
import type { Database } from '@/types/database';
import type { DatabaseLoadingProgress } from '@/types/app';

interface DatabaseContextValue {
  loadDatabase: (year: number) => Promise<Database>;
  isLoaded: (year: number) => boolean;
  loadingStates: Map<number, DatabaseLoadingProgress>;
  clearCache: (year?: number) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<
    Map<number, DatabaseLoadingProgress>
  >(new Map());

  const loadDatabase = useCallback(async (year: number): Promise<Database> => {
    // Set loading state
    setLoadingStates((prev) => {
      const next = new Map(prev);
      next.set(year, {
        year,
        state: 'loading',
        progress: 0,
        message: 'Loading database...',
      });
      return next;
    });

    try {
      const db = await databaseManager.loadDatabase(year, (progress) => {
        setLoadingStates((prev) => {
          const next = new Map(prev);
          next.set(year, {
            year,
            state: 'loading',
            progress: progress.percentage,
            message: `Downloading... ${progress.percentage}%`,
          });
          return next;
        });
      });

      // Set success state
      setLoadingStates((prev) => {
        const next = new Map(prev);
        next.set(year, {
          year,
          state: 'success',
          progress: 100,
          message: 'Database loaded',
        });
        return next;
      });

      return db;
    } catch (error) {
      // Set error state
      setLoadingStates((prev) => {
        const next = new Map(prev);
        next.set(year, {
          year,
          state: 'error',
          progress: 0,
          message: 'Failed to load database',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return next;
      });

      throw error;
    }
  }, []);

  const isLoaded = useCallback((year: number): boolean => {
    return databaseManager.isLoaded(year);
  }, []);

  const clearCache = useCallback(async (year?: number): Promise<void> => {
    await databaseManager.clearCache(year);

    if (year !== undefined) {
      setLoadingStates((prev) => {
        const next = new Map(prev);
        next.delete(year);
        return next;
      });
    } else {
      setLoadingStates(new Map());
    }
  }, []);

  const value: DatabaseContextValue = {
    loadDatabase,
    isLoaded,
    loadingStates,
    clearCache,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within DatabaseProvider');
  }
  return context;
}
