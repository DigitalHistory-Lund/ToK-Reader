import { databaseManager } from './DatabaseManager';
import type { UtteranceWithPerson } from '@/types/database';

/**
 * Fetch a single utterance with person data
 * @param year Year of the database
 * @param utteranceId ID of the utterance
 * @returns Utterance with person data or null if not found
 */
export async function getUtterance(
  year: number,
  utteranceId: string
): Promise<UtteranceWithPerson | null> {
  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE u.id = ?
  `;

  const results = await databaseManager.executeQuery(year, sql, [utteranceId]);

  if (results.length === 0) {
    return null;
  }

  return mapRowToUtterance(results[0]);
}

/**
 * Fetch a chain of utterances following prev or next links
 * @param year Year of the database
 * @param startId Starting utterance ID
 * @param direction Direction to follow ('prev' or 'next')
 * @param count Number of utterances to fetch
 * @returns Array of utterances
 */
export async function getUtteranceChain(
  year: number,
  startId: string,
  direction: 'prev' | 'next',
  count: number
): Promise<UtteranceWithPerson[]> {
  const utterances: UtteranceWithPerson[] = [];
  let currentId: string | null = startId;

  for (let i = 0; i < count && currentId; i++) {
    const utterance = await getUtterance(year, currentId);

    if (!utterance) break;

    utterances.push(utterance);
    currentId = direction === 'prev' ? utterance.prev : utterance.next;
  }

  return utterances;
}

/**
 * Fetch utterances with context (before and after)
 * @param year Year of the database
 * @param utteranceId ID of the center utterance
 * @param beforeCount Number of utterances before
 * @param afterCount Number of utterances after
 * @returns Object with before, center, and after utterances
 */
export async function getUtteranceContext(
  year: number,
  utteranceId: string,
  beforeCount: number,
  afterCount: number
): Promise<{
  before: UtteranceWithPerson[];
  center: UtteranceWithPerson | null;
  after: UtteranceWithPerson[];
}> {
  // Get center utterance
  const center = await getUtterance(year, utteranceId);

  if (!center) {
    return { before: [], center: null, after: [] };
  }

  // Get utterances before
  let before: UtteranceWithPerson[] = [];
  if (center.prev && beforeCount > 0) {
    before = await getUtteranceChain(year, center.prev, 'prev', beforeCount);
    before.reverse(); // Reverse to get chronological order
  }

  // Get utterances after
  let after: UtteranceWithPerson[] = [];
  if (center.next && afterCount > 0) {
    after = await getUtteranceChain(year, center.next, 'next', afterCount);
  }

  return { before, center, after };
}

/**
 * Get available parties for a given year
 * @param year Year of the database
 * @returns Array of distinct party names
 */
export async function getParties(year: number): Promise<string[]> {
  const sql = `
    SELECT DISTINCT party
    FROM person
    WHERE party IS NOT NULL AND party != ''
    ORDER BY party
  `;

  const results = await databaseManager.executeQuery(year, sql);
  return results.map((row) => row.party);
}

/**
 * Get date range for a given year
 * @param year Year of the database
 * @returns Min and max dates
 */
export async function getDateRange(
  year: number
): Promise<{ min: number; max: number }> {
  const sql = `
    SELECT MIN(date) as min, MAX(date) as max
    FROM utterance
  `;

  const results = await databaseManager.executeQuery(year, sql);

  if (results.length === 0) {
    return { min: year * 10000 + 101, max: year * 10000 + 1231 };
  }

  return {
    min: results[0].min || year * 10000 + 101,
    max: results[0].max || year * 10000 + 1231,
  };
}

/**
 * Map a database row to UtteranceWithPerson
 * @param row Raw database row
 * @returns Mapped utterance object
 */
function mapRowToUtterance(row: any): UtteranceWithPerson {
  return {
    id: row.id,
    content: row.content,
    prev: row.prev || null,
    next: row.next || null,
    person_id: row.person_id,
    year: row.year,
    date: row.date,
    kvinna_1: Boolean(row.kvinna_1),
    kvinna_2: Boolean(row.kvinna_2),
    kvinna_3: Boolean(row.kvinna_3),
    person_name: row.person_name,
    person_gender: row.person_gender || null,
    person_party: row.person_party || null,
  };
}
