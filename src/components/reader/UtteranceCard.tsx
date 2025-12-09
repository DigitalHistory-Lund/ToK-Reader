import { formatDate, normalizePartyName } from '@/lib/utils/urlHelpers';
import type { UtteranceWithPerson } from '@/types/database';

interface UtteranceCardProps {
  utterance: UtteranceWithPerson;
  highlighted?: boolean;
}

export function UtteranceCard({ utterance, highlighted }: UtteranceCardProps) {
  const partyColor = normalizePartyName(utterance.person_party);

  return (
    <div
      className={`border-l-4 bg-white rounded-lg shadow-sm p-6 mb-4 ${
        highlighted
          ? 'border-blue-500 bg-blue-50'
          : `border-party-${partyColor} border-gray-300`
      }`}
    >
      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
        <div className="font-semibold text-gray-800">
          {utterance.person_name}
        </div>

        {utterance.person_party && (
          <span className={`px-3 py-1 rounded-full text-white bg-party-${partyColor} bg-gray-600 text-xs font-semibold`}>
            {utterance.person_party}
          </span>
        )}

        {utterance.person_gender && (
          <span className="text-gray-600">
            {utterance.person_gender}
          </span>
        )}

        <span className="text-gray-500">
          {formatDate(utterance.date)}
        </span>

        <span className="text-xs text-gray-400 font-mono">
          {utterance.id}
        </span>
      </div>

      {/* Kvinna badges */}
      {(utterance.kvinna_1 || utterance.kvinna_2 || utterance.kvinna_3) && (
        <div className="flex gap-2 mb-3">
          {utterance.kvinna_1 && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold">
              1
            </span>
          )}
          {utterance.kvinna_2 && (
            <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded font-semibold">
              2
            </span>
          )}
          {utterance.kvinna_3 && (
            <span className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded font-semibold">
              3
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="text-gray-700 leading-relaxed prose max-w-none">
        {utterance.content}
      </div>
    </div>
  );
}
