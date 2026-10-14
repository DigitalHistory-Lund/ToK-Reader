import { useParams, Link } from 'react-router-dom';
import { useDiscussion } from '@/hooks/useDiscussions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DiscussionFileLinks } from '@/components/discussion/DiscussionFileLinks';
import { DiscussionIdNotice } from '@/components/discussion/DiscussionIdNotice';
import { getChamberLabel } from '@/lib/utils/chamber';
import { getDiscussionLabel } from '@/lib/utils/discussion';
import { getGenderSymbol, getGenderStyle } from '@/lib/utils/gender';
import { getPartyColor, getContrastTextColor } from '@/lib/utils/partyColors';
import type { DiscussionUtterance } from '@/types/discussion';

function DiscussionUtteranceCard({ utterance, year }: { utterance: DiscussionUtterance; year: number }) {
  const partyColor = getPartyColor(utterance.party);
  const textColor = getContrastTextColor(partyColor);

  return (
    <div className="border-l-4 bg-white rounded-lg shadow-sm p-6" style={{ borderLeftColor: partyColor }}>
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
        <span className="text-gray-400 font-mono">{utterance.order}.</span>
        <span className="font-semibold text-gray-800">{utterance.speaker_name}</span>
        {utterance.party && (
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: partyColor, color: textColor }}
          >
            {utterance.party}
          </span>
        )}
        {utterance.gender && (
          <span className={getGenderStyle(utterance.gender)} title={utterance.gender}>
            {getGenderSymbol(utterance.gender)}
          </span>
        )}
        {(utterance.kvinna_1 || utterance.kvinna_2 || utterance.kvinna_3) && (
          <span className="flex gap-2">
            {utterance.kvinna_1 && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold">1</span>
            )}
            {utterance.kvinna_2 && (
              <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded font-semibold">2</span>
            )}
            {utterance.kvinna_3 && (
              <span className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded font-semibold">3</span>
            )}
          </span>
        )}
        <Link
          to={`/${year}/${utterance.id}`}
          className="ml-auto text-xs text-blue-600 hover:text-blue-800 hover:underline"
          title="Open this utterance in the reader"
        >
          Open in reader →
        </Link>
      </div>
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{utterance.content}</div>
    </div>
  );
}

export function DiscussionPage() {
  const { discussionId } = useParams<{ discussionId: string }>();
  const { discussion, utterances, notFound, loading, error } = useDiscussion(
    parseInt(discussionId || '')
  );

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
        Discussion #{discussionId} was not found.{' '}
        <Link to="/discussions" className="underline">
          Back to all discussions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/discussions" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
        ← All discussions
      </Link>

      {discussion && (
        <div className="bg-white rounded-lg shadow-md p-6 my-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{getDiscussionLabel(discussion.id)}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
            <span className="text-gray-600">{discussion.date}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              {getChamberLabel(discussion.chamber)}
            </span>
            <span className="text-gray-600">
              {discussion.n_utterances} utterances · {discussion.speakers.length} speakers
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <DiscussionFileLinks discussion={discussion} size="md" />
            {discussion.first_utterance_id && (
              <Link
                to={`/${discussion.year}/${discussion.first_utterance_id}`}
                className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Open in reader →
              </Link>
            )}
          </div>
          <div className="mt-4">
            <DiscussionIdNotice version={utterances?.[0]?.source?.version} />
          </div>
        </div>
      )}

      {loading && <LoadingSpinner message="Loading discussion..." />}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
      )}

      {discussion && utterances && (
        <div className="space-y-4">
          {utterances[0]?.source && (
            <p className="text-xs text-gray-500">
              Source: ToK-Preparer version {utterances[0].source.version} ·{' '}
              <a
                href={utterances[0].source.doi_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {utterances[0].source.doi_url.replace('https://doi.org/', 'doi:')}
              </a>{' '}
              ·{' '}
              <a
                href={utterances[0].source.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Project
              </a>
            </p>
          )}
          {utterances.map((u) => (
            <DiscussionUtteranceCard key={u.id} utterance={u} year={discussion.year} />
          ))}
        </div>
      )}
    </div>
  );
}
