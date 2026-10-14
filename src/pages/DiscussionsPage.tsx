import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDiscussionIndex } from '@/hooks/useDiscussions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DiscussionFileLinks } from '@/components/discussion/DiscussionFileLinks';
import { DiscussionIdNotice } from '@/components/discussion/DiscussionIdNotice';
import { getChamberLabel } from '@/lib/utils/chamber';
import { getDiscussionLabel } from '@/lib/utils/discussion';
import { getGenderSymbol } from '@/lib/utils/gender';

const selectClass =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export function DiscussionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { index, loading, error } = useDiscussionIndex();

  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
  const chamber = searchParams.get('chamber') ? parseInt(searchParams.get('chamber')!) : undefined;
  const femaleOnly = searchParams.get('female') === '1';

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const discussions = useMemo(() => (index ? Array.from(index.values()) : []), [index]);
  const years = useMemo(
    () => Array.from(new Set(discussions.map((d) => d.year))).sort((a, b) => a - b),
    [discussions]
  );
  const filtered = useMemo(
    () =>
      discussions.filter(
        (d) =>
          (year === undefined || d.year === year) &&
          (chamber === undefined || d.chamber === chamber) &&
          (!femaleOnly || d.has_female_speaker)
      ),
    [discussions, year, chamber, femaleOnly]
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Diskussioner</h1>
        <p className="text-gray-600">
          Debates identified as discussions. Each can be read online or downloaded as PDF, DOCX or JSONL.
        </p>
        <div className="mt-4">
          <DiscussionIdNotice />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <select
            value={year ?? ''}
            onChange={(e) => updateParam('year', e.target.value || undefined)}
            className={selectClass}
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chamber</label>
          <select
            value={chamber ?? ''}
            onChange={(e) => updateParam('chamber', e.target.value || undefined)}
            className={selectClass}
          >
            <option value="">Both chambers</option>
            <option value="1">{getChamberLabel(1)}</option>
            <option value="2">{getChamberLabel(2)}</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center pb-2">
            <input
              type="checkbox"
              checked={femaleOnly}
              onChange={(e) => updateParam('female', e.target.checked ? '1' : undefined)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">With a female speaker (♀)</span>
          </label>
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading discussions..." />}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
      )}

      {index && (
        <>
          <p className="text-sm text-gray-600 mb-3">
            {filtered.length} of {discussions.length} discussions
          </p>
          <div className="bg-white rounded-lg shadow-md divide-y divide-gray-100">
            {filtered.map((d) => (
              <div key={d.id} className="p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link
                  to={`/discussion/${d.id}`}
                  className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {getDiscussionLabel(d.id)}
                </Link>
                <span className="text-gray-500 text-sm">{d.date}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  {getChamberLabel(d.chamber)}
                </span>
                <span className="text-sm text-gray-500">{d.n_utterances} utterances</span>
                <span className="text-sm text-gray-700 flex-1 min-w-[12rem]">
                  {d.speakers.map((s, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      {s.name}
                      {s.gender === 'woman' && (
                        <span className="text-red-600 font-bold"> {getGenderSymbol(s.gender)}</span>
                      )}
                    </span>
                  ))}
                </span>
                <DiscussionFileLinks discussion={d} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
