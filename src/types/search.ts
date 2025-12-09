import type { UtteranceWithPerson } from './database';

// Search parameters from URL
export interface SearchParams {
  year: number;
  query?: string;
  party?: string[];
  kvinna_1?: boolean;
  kvinna_2?: boolean;
  kvinna_3?: boolean;
  dateFrom?: number;
  dateTo?: number;
}

// Search result
export interface SearchResult extends UtteranceWithPerson {
  snippet?: string; // Context snippet with query highlighted
  relevance?: number; // For ranking
}

// Search filters state
export interface SearchFilters {
  query: string;
  party: string[];
  kvinna_1?: boolean;
  kvinna_2?: boolean;
  kvinna_3?: boolean;
  dateFrom?: number;
  dateTo?: number;
}
