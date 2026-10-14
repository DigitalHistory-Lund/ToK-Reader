import { useState, useEffect } from 'react';
import { loadDiscussionIndex, loadDiscussionUtterances } from '@/lib/discussions/discussions';
import type { DiscussionSummary, DiscussionUtterance } from '@/types/discussion';

/**
 * Hook to access the discussion index
 */
export function useDiscussionIndex() {
  const [index, setIndex] = useState<Map<number, DiscussionSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDiscussionIndex()
      .then((result) => {
        if (!cancelled) setIndex(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load discussions');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { index, loading: index === null && error === null, error };
}

/**
 * Hook to load a single discussion's summary and utterances
 */
export function useDiscussion(discussionId: number) {
  const { index, error: indexError } = useDiscussionIndex();
  const discussion = index?.get(discussionId) ?? null;
  const [utterances, setUtterances] = useState<DiscussionUtterance[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!discussion) return;
    let cancelled = false;
    setUtterances(null);
    setError(null);
    loadDiscussionUtterances(discussion)
      .then((result) => {
        if (!cancelled) setUtterances(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load discussion');
      });
    return () => {
      cancelled = true;
    };
  }, [discussion]);

  const notFound = index !== null && discussion === null;

  return {
    discussion,
    utterances,
    notFound,
    loading: !indexError && !error && !notFound && utterances === null,
    error: indexError ?? error,
  };
}
