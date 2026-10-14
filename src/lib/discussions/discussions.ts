import { config } from '@/lib/utils/config';
import type { DiscussionSummary, DiscussionUtterance } from '@/types/discussion';

let indexPromise: Promise<Map<number, DiscussionSummary>> | null = null;

/**
 * Load the discussion index (once per session), keyed by discussion id.
 * Iteration order follows the index file (date, then id).
 */
export function loadDiscussionIndex(): Promise<Map<number, DiscussionSummary>> {
  if (!indexPromise) {
    indexPromise = fetch(config.discussionIndexUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load discussion index: ${response.status} ${response.statusText}`);
        }
        return response.json() as Promise<DiscussionSummary[]>;
      })
      .then((rows) => new Map(rows.map((row) => [row.id, row])))
      .catch((err) => {
        // Allow a retry on the next call
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

/**
 * Fetch the utterances of a discussion from its per-discussion .jsonl file
 */
export async function loadDiscussionUtterances(
  discussion: DiscussionSummary
): Promise<DiscussionUtterance[]> {
  const response = await fetch(config.discussionFileUrl(discussion.file_stem, 'jsonl'));
  if (!response.ok) {
    throw new Error(`Failed to load discussion text: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as DiscussionUtterance)
    .sort((a, b) => a.order - b.order);
}
