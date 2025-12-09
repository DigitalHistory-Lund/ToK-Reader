import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDatabase } from '@/hooks/useDatabase';
import { getUtteranceContext, getUtteranceChain } from '@/lib/database/queries';
import { UtteranceCard } from '@/components/reader/UtteranceCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { UtteranceWithPerson } from '@/types/database';
import { config } from '@/lib/utils/config';

export function ReaderPage() {
  const { year: yearParam, utteranceId } = useParams<{
    year: string;
    utteranceId: string;
  }>();
  const year = parseInt(yearParam || '1920');

  const { loading: dbLoading, error: dbError } = useDatabase(year);
  const [utterances, setUtterances] = useState<UtteranceWithPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState({ top: false, bottom: false });

  // Load initial context
  useEffect(() => {
    if (dbLoading !== 'success' || !utteranceId) return;

    const loadInitial = async () => {
      setLoading(true);
      try {
        const context = await getUtteranceContext(
          year,
          utteranceId,
          config.initialContextSize,
          config.initialContextSize
        );

        if (context.center) {
          setUtterances([
            ...context.before,
            context.center,
            ...context.after,
          ]);
        }
      } catch (error) {
        console.error('Failed to load utterance context:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [year, utteranceId, dbLoading]);

  // Load more previous utterances
  const loadPrevious = async () => {
    if (utterances.length === 0 || !utterances[0].prev || loadingMore.top) {
      return;
    }

    setLoadingMore((prev) => ({ ...prev, top: true }));

    try {
      const prevUtterances = await getUtteranceChain(
        year,
        utterances[0].prev,
        'prev',
        config.scrollLoadSize
      );

      if (prevUtterances.length > 0) {
        setUtterances((prev) => [
          ...prevUtterances.reverse(),
          ...prev,
        ]);
      }
    } catch (error) {
      console.error('Failed to load previous utterances:', error);
    } finally {
      setLoadingMore((prev) => ({ ...prev, top: false }));
    }
  };

  // Load more next utterances
  const loadNext = async () => {
    if (
      utterances.length === 0 ||
      !utterances[utterances.length - 1].next ||
      loadingMore.bottom
    ) {
      return;
    }

    setLoadingMore((prev) => ({ ...prev, bottom: true }));

    try {
      const lastUtterance = utterances[utterances.length - 1];
      if (!lastUtterance.next) return;

      const nextUtterances = await getUtteranceChain(
        year,
        lastUtterance.next,
        'next',
        config.scrollLoadSize
      );

      if (nextUtterances.length > 0) {
        setUtterances((prev) => [...prev, ...nextUtterances]);
      }
    } catch (error) {
      console.error('Failed to load next utterances:', error);
    } finally {
      setLoadingMore((prev) => ({ ...prev, bottom: false }));
    }
  };

  if (dbLoading === 'loading') {
    return <LoadingSpinner message={`Loading database for year ${year}...`} />;
  }

  if (dbLoading === 'error') {
    return (
      <div className="text-center text-red-600">
        <p>Error: {dbError}</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading utterance..." />;
  }

  if (utterances.length === 0) {
    return (
      <div className="text-center text-gray-600">
        <p>Utterance not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Parliamentary Debate Reader
        </h1>
        <p className="text-gray-600">
          Year: {year} | Utterance: {utteranceId}
        </p>
      </div>

      {/* Load Previous Button */}
      {utterances[0]?.prev && (
        <div className="mb-4 text-center">
          <button
            onClick={loadPrevious}
            disabled={loadingMore.top}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loadingMore.top ? 'Loading...' : 'Load Previous'}
          </button>
        </div>
      )}

      {/* Utterances */}
      <div className="space-y-4">
        {utterances.map((utterance) => (
          <UtteranceCard
            key={utterance.id}
            utterance={utterance}
            highlighted={utterance.id === utteranceId}
          />
        ))}
      </div>

      {/* Load Next Button */}
      {utterances[utterances.length - 1]?.next && (
        <div className="mt-4 text-center">
          <button
            onClick={loadNext}
            disabled={loadingMore.bottom}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loadingMore.bottom ? 'Loading...' : 'Load Next'}
          </button>
        </div>
      )}
    </div>
  );
}
