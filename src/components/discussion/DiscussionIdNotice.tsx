interface DiscussionIdNoticeProps {
  version?: string;
}

export function DiscussionIdNotice({ version }: DiscussionIdNoticeProps) {
  return (
    <div
      role="note"
      className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900"
    >
      <span className="font-semibold">Note:</span> Discussion numbers are not stable between data
      versions. Discussion #123 in {version ? `version ${version}` : 'this version'} may refer to a
      different debate in the next release. When citing a discussion, also give its date, chamber
      and the data version (DOI).
    </div>
  );
}
