import { useState, useEffect } from 'react';
import { useDatabaseContext } from '@/context/DatabaseContext';
import type { Database } from '@/types/database';
import type { LoadingState } from '@/types/app';

/**
 * Hook to load and access a database for a given year
 * @param year Year of the database to load
 * @returns Database, loading state, and error
 */
export function useDatabase(year: number) {
  const { loadDatabase, isLoaded } = useDatabaseContext();
  const [database, setDatabase] = useState<Database | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (isLoaded(year)) {
        setLoading('success');
        return;
      }

      setLoading('loading');
      setError(null);

      try {
        const db = await loadDatabase(year);
        if (!cancelled) {
          setDatabase(db);
          setLoading('success');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load database');
          setLoading('error');
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [year, loadDatabase, isLoaded]);

  return { database, loading, error, isLoaded: isLoaded(year) };
}
