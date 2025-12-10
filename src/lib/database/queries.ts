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
 * Get the start of the exchange containing this utterance
 * (Follow prev links until we hit null)
 * @param year Year of the database
 * @param utteranceId ID of any utterance in the exchange
 * @returns First utterance of the exchange
 */
export async function getExchangeStart(year: number, utteranceId: string): Promise<UtteranceWithPerson | null> {
  let currentId = utteranceId;
  let utterance = await getUtterance(year, currentId);

  if (!utterance) return null;

  // Follow prev links until we reach the start (prev === null)
  while (utterance.prev) {
    const prevUtterance = await getUtterance(year, utterance.prev);
    if (!prevUtterance) break; // Broken link
    utterance = prevUtterance;
  }

  return utterance;
}

/**
 * Get the first utterance of the previous exchange
 * @param year Year of the database
 * @param currentUtteranceId Current utterance ID
 * @returns First utterance of previous exchange or null
 */
export async function getPreviousExchange(year: number, currentUtteranceId: string): Promise<UtteranceWithPerson | null> {
  // Find the start of the current exchange
  const currentExchangeStart = await getExchangeStart(year, currentUtteranceId);
  if (!currentExchangeStart) return null;

  // Find utterances that start an exchange (prev IS NULL) before this one
  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE u.prev IS NULL
      AND (u.date < ? OR (u.date = ? AND u.id < ?))
    ORDER BY u.date DESC, u.id DESC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql, [
    currentExchangeStart.date,
    currentExchangeStart.date,
    currentExchangeStart.id
  ]);

  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the first utterance of the next exchange
 * @param year Year of the database
 * @param currentUtteranceId Current utterance ID
 * @returns First utterance of next exchange or null
 */
export async function getNextExchange(year: number, currentUtteranceId: string): Promise<UtteranceWithPerson | null> {
  // Find the start of the current exchange
  const currentExchangeStart = await getExchangeStart(year, currentUtteranceId);
  if (!currentExchangeStart) return null;

  // Find utterances that start an exchange (prev IS NULL) after this one
  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE u.prev IS NULL
      AND (u.date > ? OR (u.date = ? AND u.id > ?))
    ORDER BY u.date ASC, u.id ASC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql, [
    currentExchangeStart.date,
    currentExchangeStart.date,
    currentExchangeStart.id
  ]);

  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the first utterance of a year
 * @param year Year of the database
 * @returns First utterance or null
 */
export async function getFirstUtterance(year: number): Promise<UtteranceWithPerson | null> {
  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    ORDER BY u.date ASC, u.id ASC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql);
  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the last utterance of a year
 * @param year Year of the database
 * @returns Last utterance or null
 */
export async function getLastUtterance(year: number): Promise<UtteranceWithPerson | null> {
  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    ORDER BY u.date DESC, u.id DESC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql);
  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the start of the last exchange in a year
 * @param year Year of the database
 * @returns First utterance of the last exchange or null
 */
export async function getLastExchange(year: number): Promise<UtteranceWithPerson | null> {
  // First, get the last utterance of the year
  const lastUtterance = await getLastUtterance(year);
  if (!lastUtterance) return null;

  // Then find the start of that utterance's exchange
  return await getExchangeStart(year, lastUtterance.id);
}

/**
 * Get the previous utterance with any kvinna tag
 * @param year Year of the database
 * @param currentUtteranceId Current utterance ID
 * @returns Previous kvinna utterance or null
 */
export async function getPreviousKvinnaUtterance(year: number, currentUtteranceId: string): Promise<UtteranceWithPerson | null> {
  const currentUtterance = await getUtterance(year, currentUtteranceId);
  if (!currentUtterance) return null;

  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE (u.kvinna_1 = 1 OR u.kvinna_2 = 1 OR u.kvinna_3 = 1)
      AND (u.date < ? OR (u.date = ? AND u.id < ?))
    ORDER BY u.date DESC, u.id DESC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql, [
    currentUtterance.date,
    currentUtterance.date,
    currentUtterance.id
  ]);

  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the next utterance with any kvinna tag
 * @param year Year of the database
 * @param currentUtteranceId Current utterance ID
 * @returns Next kvinna utterance or null
 */
export async function getNextKvinnaUtterance(year: number, currentUtteranceId: string): Promise<UtteranceWithPerson | null> {
  const currentUtterance = await getUtterance(year, currentUtteranceId);
  if (!currentUtterance) return null;

  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE (u.kvinna_1 = 1 OR u.kvinna_2 = 1 OR u.kvinna_3 = 1)
      AND (u.date > ? OR (u.date = ? AND u.id > ?))
    ORDER BY u.date ASC, u.id ASC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql, [
    currentUtterance.date,
    currentUtterance.date,
    currentUtterance.id
  ]);

  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the previous utterance by a female speaker
 * @param year Year of the database
 * @param currentUtteranceId Current utterance ID
 * @returns Previous female speaker utterance or null
 */
export async function getPreviousFemaleUtterance(year: number, currentUtteranceId: string): Promise<UtteranceWithPerson | null> {
  const currentUtterance = await getUtterance(year, currentUtteranceId);
  if (!currentUtterance) return null;

  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE LOWER(p.gender) IN ('woman', 'kvinna')
      AND (u.date < ? OR (u.date = ? AND u.id < ?))
    ORDER BY u.date DESC, u.id DESC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql, [
    currentUtterance.date,
    currentUtterance.date,
    currentUtterance.id
  ]);

  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the next utterance by a female speaker
 * @param year Year of the database
 * @param currentUtteranceId Current utterance ID
 * @returns Next female speaker utterance or null
 */
export async function getNextFemaleUtterance(year: number, currentUtteranceId: string): Promise<UtteranceWithPerson | null> {
  const currentUtterance = await getUtterance(year, currentUtteranceId);
  if (!currentUtterance) return null;

  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE LOWER(p.gender) IN ('woman', 'kvinna')
      AND (u.date > ? OR (u.date = ? AND u.id > ?))
    ORDER BY u.date ASC, u.id ASC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql, [
    currentUtterance.date,
    currentUtterance.date,
    currentUtterance.id
  ]);

  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the first utterance with any kvinna tag in a year
 * @param year Year of the database
 * @returns First kvinna utterance or null
 */
export async function getFirstKvinnaUtterance(year: number): Promise<UtteranceWithPerson | null> {
  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE (u.kvinna_1 = 1 OR u.kvinna_2 = 1 OR u.kvinna_3 = 1)
    ORDER BY u.date ASC, u.id ASC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql);
  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the last utterance with any kvinna tag in a year
 * @param year Year of the database
 * @returns Last kvinna utterance or null
 */
export async function getLastKvinnaUtterance(year: number): Promise<UtteranceWithPerson | null> {
  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE (u.kvinna_1 = 1 OR u.kvinna_2 = 1 OR u.kvinna_3 = 1)
    ORDER BY u.date DESC, u.id DESC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql);
  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the first utterance by a female speaker in a year
 * @param year Year of the database
 * @returns First female speaker utterance or null
 */
export async function getFirstFemaleUtterance(year: number): Promise<UtteranceWithPerson | null> {
  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE LOWER(p.gender) IN ('woman', 'kvinna')
    ORDER BY u.date ASC, u.id ASC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql);
  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
}

/**
 * Get the last utterance by a female speaker in a year
 * @param year Year of the database
 * @returns Last female speaker utterance or null
 */
export async function getLastFemaleUtterance(year: number): Promise<UtteranceWithPerson | null> {
  const sql = `
    SELECT
      u.*,
      p.name as person_name,
      p.gender as person_gender,
      p.party as person_party
    FROM utterance u
    JOIN person p ON u.person_id = p.id
    WHERE LOWER(p.gender) IN ('woman', 'kvinna')
    ORDER BY u.date DESC, u.id DESC
    LIMIT 1
  `;

  const results = await databaseManager.executeQuery(year, sql);
  if (results.length === 0) return null;
  return mapRowToUtterance(results[0]);
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
