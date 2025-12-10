import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '@/hooks/useDatabase';
import { getUtteranceContext, getUtteranceChain, getPreviousExchange, getNextExchange, getFirstUtterance, getLastExchange, getPreviousKvinnaUtterance, getNextKvinnaUtterance, getPreviousFemaleUtterance, getNextFemaleUtterance, getFirstKvinnaUtterance, getLastKvinnaUtterance, getFirstFemaleUtterance, getLastFemaleUtterance } from '@/lib/database/queries';
import { UtteranceCard } from '@/components/reader/UtteranceCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { UtteranceWithPerson } from '@/types/database';
import { config } from '@/lib/utils/config';
import { formatDate } from '@/lib/utils/urlHelpers';

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

  // Navigate to previous exchange
  const handlePrevious = async () => {
    if (!utteranceId) return;

    try {
      const prevExchange = await getPreviousExchange(year, utteranceId);

      if (prevExchange) {
        // Found previous exchange in same year
        navigate(`/${year}/${prevExchange.id}`);
      } else {
        // No previous exchange in this year - try last exchange of previous year
        const prevYear = year - 1;
        try {
          const lastExchangeOfPrevYear = await getLastExchange(prevYear);
          if (lastExchangeOfPrevYear) {
            navigate(`/${prevYear}/${lastExchangeOfPrevYear.id}`);
          }
        } catch (error) {
          console.error('Previous year not available:', error);
        }
      }
    } catch (error) {
      console.error('Failed to navigate to previous exchange:', error);
    }
  };

  // Navigate to next exchange
  const handleNext = async () => {
    if (!utteranceId) return;

    try {
      const nextExchange = await getNextExchange(year, utteranceId);

      if (nextExchange) {
        // Found next exchange in same year
        navigate(`/${year}/${nextExchange.id}`);
      } else {
        // No next exchange in this year - try next year
        const nextYear = year + 1;
        try {
          const firstOfNextYear = await getFirstUtterance(nextYear);
          if (firstOfNextYear) {
            navigate(`/${nextYear}/${firstOfNextYear.id}`);
          }
        } catch (error) {
          console.error('Next year not available:', error);
        }
      }
    } catch (error) {
      console.error('Failed to navigate to next exchange:', error);
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

  // Handle utterance card click
  const handleUtteranceClick = (clickedUtteranceId: string) => {
    if (clickedUtteranceId !== utteranceId) {
      navigate(`/${year}/${clickedUtteranceId}`, { replace: true });
    }
  };

  // Navigate to previous kvinna utterance
  const handlePreviousKvinna = async () => {
    if (!utteranceId) return;

    try {
      const prevKvinna = await getPreviousKvinnaUtterance(year, utteranceId);
      if (prevKvinna) {
        // Found previous kvinna in same year
        navigate(`/${year}/${prevKvinna.id}`);
      } else {
        // No previous kvinna in this year - try previous years
        // Keep trying earlier years until we find one with kvinna utterances
        for (let tryYear = year - 1; tryYear >= 1867; tryYear--) {
          try {
            const lastKvinnaOfPrevYear = await getLastKvinnaUtterance(tryYear);
            if (lastKvinnaOfPrevYear) {
              navigate(`/${tryYear}/${lastKvinnaOfPrevYear.id}`);
              return;
            }
          } catch (error) {
            // Year database not available, continue to next year
            continue;
          }
        }
        console.log('No previous kvinna utterance found');
      }
    } catch (error) {
      console.error('Failed to navigate to previous kvinna utterance:', error);
    }
  };

  // Navigate to next kvinna utterance
  const handleNextKvinna = async () => {
    if (!utteranceId) return;

    try {
      const nextKvinna = await getNextKvinnaUtterance(year, utteranceId);
      if (nextKvinna) {
        // Found next kvinna in same year
        navigate(`/${year}/${nextKvinna.id}`);
      } else {
        // No next kvinna in this year - try future years
        // Keep trying later years until we find one with kvinna utterances
        for (let tryYear = year + 1; tryYear <= 2024; tryYear++) {
          try {
            const firstKvinnaOfNextYear = await getFirstKvinnaUtterance(tryYear);
            if (firstKvinnaOfNextYear) {
              navigate(`/${tryYear}/${firstKvinnaOfNextYear.id}`);
              return;
            }
          } catch (error) {
            // Year database not available, continue to next year
            continue;
          }
        }
        console.log('No next kvinna utterance found');
      }
    } catch (error) {
      console.error('Failed to navigate to next kvinna utterance:', error);
    }
  };

  // Navigate to previous female speaker utterance
  const handlePreviousFemale = async () => {
    if (!utteranceId) return;

    try {
      const prevFemale = await getPreviousFemaleUtterance(year, utteranceId);
      if (prevFemale) {
        // Found previous female speaker in same year
        navigate(`/${year}/${prevFemale.id}`);
      } else {
        // No previous female speaker in this year - try previous years
        // Keep trying earlier years until we find one with female speakers
        for (let tryYear = year - 1; tryYear >= 1867; tryYear--) {
          try {
            const lastFemaleOfPrevYear = await getLastFemaleUtterance(tryYear);
            if (lastFemaleOfPrevYear) {
              navigate(`/${tryYear}/${lastFemaleOfPrevYear.id}`);
              return;
            }
          } catch (error) {
            // Year database not available, continue to next year
            continue;
          }
        }
        console.log('No previous female speaker utterance found');
      }
    } catch (error) {
      console.error('Failed to navigate to previous female utterance:', error);
    }
  };

  // Navigate to next female speaker utterance
  const handleNextFemale = async () => {
    if (!utteranceId) return;

    try {
      const nextFemale = await getNextFemaleUtterance(year, utteranceId);
      if (nextFemale) {
        // Found next female speaker in same year
        navigate(`/${year}/${nextFemale.id}`);
      } else {
        // No next female speaker in this year - try future years
        // Keep trying later years until we find one with female speakers
        for (let tryYear = year + 1; tryYear <= 2024; tryYear++) {
          try {
            const firstFemaleOfNextYear = await getFirstFemaleUtterance(tryYear);
            if (firstFemaleOfNextYear) {
              navigate(`/${tryYear}/${firstFemaleOfNextYear.id}`);
              return;
            }
          } catch (error) {
            // Year database not available, continue to next year
            continue;
          }
        }
        console.log('No next female speaker utterance found');
      }
    } catch (error) {
      console.error('Failed to navigate to next female utterance:', error);
    }
  };

  // Scroll to selected utterance when URL changes
  useEffect(() => {
    if (!utteranceId || utterances.length === 0) return;

    // Wait a bit for the DOM to update
    const timeoutId = setTimeout(() => {
      const element = utteranceRefs.current.get(utteranceId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [utteranceId, utterances]);

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
      {/* Sticky Header with Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6 -mx-4 px-4 py-4">
        <div className="max-w-4xl mx-auto">


          {/* Exchange Navigation */}
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={handlePrevious}
              className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>←</span>
              <span>Exchange</span>
            </button>
            <p className="text-gray-600 font-medium">
              Parliamentary Debate Reader
            </p>
            <button
              onClick={handleNext}
              className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>Exchange</span>
              <span>→</span>
            </button>
          </div>

          {/* Kvinna Navigation */}
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={handlePreviousKvinna}
              className="px-3 py-0.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
            >
              <span>←</span>
              <span>Kvinna</span>
            </button>
            <span className="text-sm text-gray-500">{utteranceId}</span>
            <button
              onClick={handleNextKvinna}
              className="px-3 py-0.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
            >
              <span>Kvinna</span>
              <span>→</span>
            </button>
          </div>

          {/* Female Speaker Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousFemale}
              className="px-3 py-0.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2 text-sm"
            >
              <span>←</span>
              <span>♀ Speaker</span>
            </button>
            <span className="text-sm text-gray-500">{utterances.find(u => u.id === utteranceId)?.date
              ? formatDate(utterances.find(u => u.id === utteranceId)!.date)
              : `Year: ${year}`}</span>
            <button
              onClick={handleNextFemale}
              className="px-3 py-0.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2 text-sm"
            >
              <span>♀ Speaker</span>
              <span>→</span>
            </button>
          </div>
        </div>
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
            onClick={() => handleUtteranceClick(utterance.id)}
            className="cursor-pointer"
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
