import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const { loading: dbLoading, error: dbError } = useDatabase(year);
  const [utterances, setUtterances] = useState<UtteranceWithPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState({ top: false, bottom: false });

  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const utteranceRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!topSentinelRef.current || !bottomSentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === topSentinelRef.current) {
              loadPrevious();
            } else if (entry.target === bottomSentinelRef.current) {
              loadNext();
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(topSentinelRef.current);
    observer.observe(bottomSentinelRef.current);

    return () => observer.disconnect();
  }, [utterances, loadingMore]);

  // Update URL based on visible utterance
  useEffect(() => {
    if (utterances.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        // Find the utterance closest to the center of the viewport
        const viewportCenter = window.innerHeight / 2;
        let closestUtterance: UtteranceWithPerson | null = null;
        let closestDistance = Infinity;

        utterances.forEach((utterance) => {
          const element = utteranceRefs.current.get(utterance.id);
          if (!element) return;

          const rect = element.getBoundingClientRect();
          const elementCenter = rect.top + rect.height / 2;
          const distance = Math.abs(elementCenter - viewportCenter);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestUtterance = utterance;
          }
        });

        if (closestUtterance !== null) {
          const newUtteranceId = (closestUtterance as UtteranceWithPerson).id;
          if (newUtteranceId !== utteranceId) {
            // Update URL without triggering navigation
            navigate(`/${year}/${newUtteranceId}`, { replace: true });
          }
        }
      }, config.scrollDebounceMs);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [utterances, year, utteranceId, navigate]);

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
    <div ref={containerRef} className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Parliamentary Debate Reader
        </h1>
        <p className="text-gray-600">
          Year: {year} | Utterance: {utteranceId}
        </p>
      </div>

      {/* Top sentinel for infinite scroll */}
      <div ref={topSentinelRef} className="h-4">
        {loadingMore.top && (
          <div className="text-center py-2">
            <LoadingSpinner message="Loading previous..." />
          </div>
        )}
      </div>

      {/* Utterances */}
      <div className="space-y-4">
        {utterances.map((utterance) => (
          <div
            key={utterance.id}
            ref={(el) => {
              if (el) {
                utteranceRefs.current.set(utterance.id, el);
              } else {
                utteranceRefs.current.delete(utterance.id);
              }
            }}
          >
            <UtteranceCard
              utterance={utterance}
              highlighted={utterance.id === utteranceId}
            />
          </div>
        ))}
      </div>

      {/* Bottom sentinel for infinite scroll */}
      <div ref={bottomSentinelRef} className="h-4">
        {loadingMore.bottom && (
          <div className="text-center py-2">
            <LoadingSpinner message="Loading next..." />
          </div>
        )}
      </div>
    </div>
  );
}
