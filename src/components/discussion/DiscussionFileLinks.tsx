import { config } from '@/lib/utils/config';
import { DISCUSSION_FILE_FORMATS } from '@/types/discussion';
import type { DiscussionSummary } from '@/types/discussion';

interface DiscussionFileLinksProps {
  discussion: DiscussionSummary;
  size?: 'sm' | 'md';
}

export function DiscussionFileLinks({ discussion, size = 'sm' }: DiscussionFileLinksProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className="inline-flex items-center gap-1">
      {DISCUSSION_FILE_FORMATS.map((format) => (
        <a
          key={format}
          href={config.discussionFileUrl(discussion.file_stem, format)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`${sizeClass} rounded-full font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-colors`}
          title={`Download ${format.toUpperCase()} of discussion #${discussion.id}`}
        >
          ↓ {format.toUpperCase()}
        </a>
      ))}
    </span>
  );
}
