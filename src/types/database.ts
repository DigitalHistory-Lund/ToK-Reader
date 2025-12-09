import type { Database as SqlJsDatabase } from 'sql.js';

// Person table
export interface Person {
  id: number;
  name: string;
  gender: string | null;
  party: string | null;
}

// Utterance table
export interface Utterance {
  id: string;
  content: string;
  prev: string | null;
  next: string | null;
  person_id: number;
  year: number;
  date: number; // YYYYMMDD format
  kvinna_1: boolean;
  kvinna_2: boolean;
  kvinna_3: boolean;
}

// Utterance with person data joined
export interface UtteranceWithPerson extends Utterance {
  person_name: string;
  person_gender: string | null;
  person_party: string | null;
}

// sql.js Database type
export type Database = SqlJsDatabase;

// Database cache entry
export interface DatabaseCacheEntry {
  year: number;
  data: Uint8Array;
  timestamp: number;
  version: string;
}
