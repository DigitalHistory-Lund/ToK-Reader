import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDatabase } from '@/hooks/useDatabase';
import { searchEngine } from '@/lib/search/SearchEngine';
import { getParties } from '@/lib/database/queries';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate, truncateText } from '@/lib/utils/urlHelpers';
import type { SearchResult } from '@/types/search';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const year = parseInt(searchParams.get('year') || '1920');

  const { loading: dbLoading, error: dbError } = useDatabase(year);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [parties, setParties] = useState<string[]>([]);

  // Form state
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [selectedParties, setSelectedParties] = useState<string[]>(
    searchParams.getAll('party')
  );
  const [kvinna1, setKvinna1] = useState<boolean | undefined>(
    searchParams.get('kvinna_1') === '1' ? true : searchParams.get('kvinna_1') === '0' ? false : undefined
  );
  const [kvinna2, setKvinna2] = useState<boolean | undefined>(
    searchParams.get('kvinna_2') === '1' ? true : searchParams.get('kvinna_2') === '0' ? false : undefined
  );
  const [kvinna3, setKvinna3] = useState<boolean | undefined>(
    searchParams.get('kvinna_3') === '1' ? true : searchParams.get('kvinna_3') === '0' ? false : undefined
  );
  const [selectedGender, setSelectedGender] = useState<string | undefined>(
    searchParams.get('gender') || undefined
  );
  const [selectedSpeaker, setSelectedSpeaker] = useState<number | undefined>(
    searchParams.get('speaker') ? parseInt(searchParams.get('speaker')!) : undefined
  );
  const [speakerName, setSpeakerName] = useState<string>('');

  // Load parties when database is ready
  useEffect(() => {
    if (dbLoading === 'success') {
      getParties(year).then(setParties);
    }
  }, [year, dbLoading]);

  // Get speaker name from results
  useEffect(() => {
    if (selectedSpeaker && results.length > 0) {
      const result = results.find(r => r.person_id === selectedSpeaker);
      if (result) setSpeakerName(result.person_name);
    }
  }, [selectedSpeaker, results]);

  // Perform search
  useEffect(() => {
    if (dbLoading !== 'success') return;

    const performSearch = async () => {
      setSearching(true);
      try {
        const searchResults = await searchEngine.search({
          year,
          query: query || undefined,
          party: selectedParties.length > 0 ? selectedParties : undefined,
          gender: selectedGender,
          speaker: selectedSpeaker,
          kvinna_1: kvinna1,
          kvinna_2: kvinna2,
          kvinna_3: kvinna3,
        });
        setResults(searchResults);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setSearching(false);
      }
    };

    performSearch();
  }, [year, query, selectedParties, selectedGender, selectedSpeaker, kvinna1, kvinna2, kvinna3, dbLoading]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('year', year.toString());
    if (query) params.set('query', query);
    selectedParties.forEach((p) => params.append('party', p));
    if (selectedGender) params.set('gender', selectedGender);
    if (selectedSpeaker) params.set('speaker', selectedSpeaker.toString());
    if (kvinna1 !== undefined) params.set('kvinna_1', kvinna1 ? '1' : '0');
    if (kvinna2 !== undefined) params.set('kvinna_2', kvinna2 ? '1' : '0');
    if (kvinna3 !== undefined) params.set('kvinna_3', kvinna3 ? '1' : '0');
    setSearchParams(params);
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

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Search Parliamentary Debates - {year}
      </h1>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter search terms..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Party Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Party
            </label>
            <select
              multiple
              value={selectedParties}
              onChange={(e) =>
                setSelectedParties(
                  Array.from(e.target.selectedOptions, (option) => option.value)
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              size={5}
            >
              {parties.map((party) => (
                <option key={party} value={party}>
                  {party}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={selectedGender || ''}
              onChange={(e) => setSelectedGender(e.target.value || undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="man">Male (♂)</option>
              <option value="woman">Female (♀)</option>
            </select>
          </div>

          {/* Kvinna Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kvinna Tags
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={kvinna1 === true}
                  onChange={(e) =>
                    setKvinna1(e.target.checked ? true : undefined)
                  }
                  className="mr-2"
                />
                <span className="text-sm">Kvinna 1 (kvinn* keywords)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={kvinna2 === true}
                  onChange={(e) =>
                    setKvinna2(e.target.checked ? true : undefined)
                  }
                  className="mr-2"
                />
                <span className="text-sm">Kvinna 2 (pronouns)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={kvinna3 === true}
                  onChange={(e) =>
                    setKvinna3(e.target.checked ? true : undefined)
                  }
                  className="mr-2"
                />
                <span className="text-sm">Kvinna 3 (occupational titles)</span>
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Speaker Filter Display */}
      {selectedSpeaker && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-sm text-blue-800">
            Filtering by speaker: <strong>{speakerName || `ID: ${selectedSpeaker}`}</strong>
          </span>
          <button
            onClick={() => {
              setSelectedSpeaker(undefined);
              setSpeakerName('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Search Results ({results.length})
        </h2>

        {searching && <LoadingSpinner message="Searching..." />}

        {!searching && results.length === 0 && (
          <p className="text-gray-600 text-center py-8">
            No results found. Try adjusting your search criteria.
          </p>
        )}

        <div className="space-y-4">
          {results.map((result) => (
            <Link
              key={result.id}
              to={`/${year}/${result.id}`}
              className="block border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold text-gray-800">
                  {result.person_name}
                  {result.person_party && (
                    <span className="ml-2 text-sm text-gray-600">
                      ({result.person_party})
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(result.date)}
                </div>
              </div>
              <p className="text-gray-700">
                {result.snippet || truncateText(result.content, 200)}
              </p>
              <div className="mt-2 flex gap-2">
                {result.kvinna_1 && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    1
                  </span>
                )}
                {result.kvinna_2 && (
                  <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">
                    2
                  </span>
                )}
                {result.kvinna_3 && (
                  <span className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded">
                    3
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
