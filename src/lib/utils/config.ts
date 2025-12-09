// Environment configuration
export const config = {
  // Development vs production mode
  isDevelopment: import.meta.env.DEV,

  // Force remote database loading (for testing)
  forceRemote: import.meta.env.VITE_USE_REMOTE_DB === 'true',

  // Database URLs
  databaseBaseUrl: (import.meta.env.DEV && import.meta.env.VITE_USE_REMOTE_DB !== 'true')
    ? '/dbs'
    : 'https://raw.githubusercontent.com/DigitalHistory-Lund/ToK-Preparer/main',

  // Database filename pattern
  databaseFilename: (year: number) =>
    (import.meta.env.DEV && import.meta.env.VITE_USE_REMOTE_DB !== 'true')
      ? `ToK_data_${year}.sqlite3`
      : `ToK_data_${year}.sqlite3.gz`,

  // Full database URL
  databaseUrl: (year: number) => {
    const base = config.databaseBaseUrl;
    const filename = config.databaseFilename(year);
    return `${base}/${filename}`;
  },

  // Cache settings
  cacheVersion: '1.0.0',
  maxCachedDatabases: 3, // Max databases in memory
  cacheDbName: 'tok-reader-cache',
  cacheStoreName: 'databases',

  // sql.js settings
  sqlJsWasmUrl: import.meta.env.DEV
    ? '/sql-wasm.wasm'
    : '/ToK-Reader/sql-wasm.wasm',

  // Search settings
  maxSearchResults: 100,
  searchDebounceMs: 500,

  // Reader settings
  initialContextSize: 5, // Utterances before/after
  scrollLoadSize: 10, // Utterances to load on scroll
  scrollDebounceMs: 300,
} as const;
