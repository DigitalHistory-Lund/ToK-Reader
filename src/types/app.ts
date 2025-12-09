import type { Database } from './database';

// Loading state for async operations
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Database loading progress
export interface DatabaseLoadingProgress {
  year: number;
  state: LoadingState;
  progress: number; // 0-100
  message: string;
  error?: string;
}

// Global database context state
export interface DatabaseContextState {
  loadedDatabases: Map<number, Database>;
  loadingStates: Map<number, DatabaseLoadingProgress>;
  loadDatabase: (year: number) => Promise<Database>;
  clearCache: (year?: number) => Promise<void>;
}

// Year range
export interface YearRange {
  start: number;
  end: number;
}

// Available years in the dataset
export const AVAILABLE_YEARS = Array.from({ length: 41 }, (_, i) => 1900 + i);
export const MIN_YEAR = 1900;
export const MAX_YEAR = 1940;
