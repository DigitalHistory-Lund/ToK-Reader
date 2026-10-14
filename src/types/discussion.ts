// Row in public/discussions-index.json (see scripts/build-discussion-index.mjs)
export interface DiscussionSpeaker {
  name: string;
  gender: string | null;
  party: string | null;
}

export interface DiscussionSummary {
  id: number;
  year: number;
  date: string; // YYYY-MM-DD
  chamber: number;
  n_utterances: number;
  first_utterance_id: string | null;
  file_stem: string; // e.g. "1930/1930-01-17_ak_d1841"
  has_female_speaker: boolean;
  speakers: DiscussionSpeaker[];
}

// Attribution stamped into every discussion reference file
export interface DiscussionSource {
  project_url: string;
  doi_url: string;
  version: string;
}

// Line in a per-discussion .jsonl reference file
export interface DiscussionUtterance {
  id: string;
  discussion_id: number;
  order: number;
  date: string;
  chamber: number;
  content: string;
  speaker_id: string;
  speaker_name: string;
  gender: string | null;
  party: string | null;
  kvinna_1: boolean;
  kvinna_2: boolean;
  kvinna_3: boolean;
  source?: DiscussionSource;
}

export type DiscussionFileFormat = 'pdf' | 'docx' | 'jsonl';

export const DISCUSSION_FILE_FORMATS: DiscussionFileFormat[] = ['pdf', 'docx', 'jsonl'];
