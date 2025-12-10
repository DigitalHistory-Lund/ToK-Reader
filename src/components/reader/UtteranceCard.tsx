import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils/urlHelpers';
import { getPartyColor, getContrastTextColor } from '@/lib/utils/partyColors';
import type { UtteranceWithPerson } from '@/types/database';

interface UtteranceCardProps {
  utterance: UtteranceWithPerson;
  highlighted?: boolean;
}

export function UtteranceCard({ utterance, highlighted }: UtteranceCardProps) {
  const partyColor = getPartyColor(utterance.person_party);
  const textColor = getContrastTextColor(partyColor);

  const getGenderSymbol = (gender: string | null): string => {
    if (!gender) return '';
    const lower = gender.toLowerCase();
    if (lower === 'man' || lower === 'män') return '♂';
    if (lower === 'woman' || lower === 'kvinna') return '♀';
    return gender;
  };

  const getGenderStyle = (gender: string | null): string => {
    if (!gender) return 'text-gray-600';
    const lower = gender.toLowerCase();
    if (lower === 'man' || lower === 'män') return 'text-blue-600 font-bold text-lg';
    if (lower === 'woman' || lower === 'kvinna') return 'text-red-600 font-bold text-lg';
    return 'text-gray-600';
  };

  return (
    <div
      className={`border-l-4 bg-white rounded-lg shadow-sm p-6 mb-4 ${
        highlighted ? 'border-blue-500 bg-blue-50' : ''
      }`}
      style={!highlighted ? { borderLeftColor: partyColor } : {}}
    >
      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
        <Link
          to={`/search?year=${utterance.year}&speaker=${utterance.person_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          title={`View all utterances by ${utterance.person_name}`}
        >
          {utterance.person_name}
        </Link>

        {utterance.person_party && (
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: partyColor, color: textColor }}
          >
            {utterance.person_party}
          </span>
        )}

        {utterance.person_gender && (
          <span className={getGenderStyle(utterance.person_gender)} title={utterance.person_gender}>
            {getGenderSymbol(utterance.person_gender)}
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
