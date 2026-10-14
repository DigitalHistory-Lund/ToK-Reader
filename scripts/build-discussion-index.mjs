// Build a slim, metadata-only discussion index from ToK-Preparer's aggregate
// discussions.jsonl.gz (which carries full utterance text and is too large to
// ship to the browser).
//
// Usage: node scripts/build-discussion-index.mjs [path-to-discussions.jsonl.gz]
import { createReadStream, writeFileSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.resolve(
  process.argv[2] ?? path.join(root, '..', 'ToK-Preparer', 'discussions', 'discussions.jsonl.gz'),
);
const output = path.join(root, 'public', 'discussions-index.json');

const CHAMBER_CODES = { 1: 'fk', 2: 'ak' };

let stream = createReadStream(input);
if (input.endsWith('.gz')) stream = stream.pipe(createGunzip());

const discussions = [];
for await (const line of createInterface({ input: stream, crlfDelay: Infinity })) {
  if (!line.trim()) continue;
  const d = JSON.parse(line);
  const chamberCode = CHAMBER_CODES[d.chamber];
  if (!chamberCode) throw new Error(`Unknown chamber ${d.chamber} for discussion ${d.discussion_id}`);

  const utterances = [...d.utterances].sort((a, b) => a.order - b.order);
  const speakers = [];
  const seen = new Set();
  for (const u of utterances) {
    if (seen.has(u.speaker_id)) continue;
    seen.add(u.speaker_id);
    speakers.push({ name: u.speaker_name, gender: u.gender ?? null, party: u.party ?? null });
  }

  discussions.push({
    id: d.discussion_id,
    year: d.year,
    date: d.date,
    chamber: d.chamber,
    n_utterances: d.n_utterances,
    first_utterance_id: utterances[0]?.id ?? null,
    file_stem: `${d.year}/${d.date}_${chamberCode}_d${String(d.discussion_id).padStart(4, '0')}`,
    has_female_speaker: speakers.some((s) => s.gender === 'woman'),
    speakers,
  });
}

discussions.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
writeFileSync(output, JSON.stringify(discussions));
console.log(`Wrote ${discussions.length} discussions to ${path.relative(root, output)}`);
