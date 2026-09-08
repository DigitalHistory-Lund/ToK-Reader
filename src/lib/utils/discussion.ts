export function getDiscussionLabel(discussion_id: number | null | undefined): string | null {
  if (discussion_id == null) return null;
  return `Diskussion #${discussion_id}`;
}
