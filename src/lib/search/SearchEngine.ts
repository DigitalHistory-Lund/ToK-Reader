import { databaseManager } from '../database/DatabaseManager';
import { config } from '../utils/config';
import { createSnippet } from '../utils/urlHelpers';
import type { SearchParams, SearchResult } from '@/types/search';

/**
 * Search Engine
 * Builds and executes SQL queries for searching utterances
 */
export class SearchEngine {
  /**
   * Search utterances in a database
   * @param params Search parameters
   * @returns Array of search results
   */
  async search(params: SearchParams): Promise<SearchResult[]> {
    const { year, query } = params;

    // Build SQL query
    const { sql, bindings } = this.buildQuery(params);

    // Execute query
    const results = await databaseManager.executeQuery(year, sql, bindings);

    // Map results
    const searchResults: SearchResult[] = results.map((row) => {
      const result: SearchResult = {
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

      // Add snippet if query exists
      if (query) {
        result.snippet = createSnippet(row.content, query, 100);
      }

      return result;
    });

    return searchResults;
  }

  /**
   * Build SQL query from search parameters
   * @param params Search parameters
   * @returns SQL query and bindings
   */
  private buildQuery(params: SearchParams): { sql: string; bindings: any[] } {
    const { query, party, gender, speaker, kvinna_1, kvinna_2, kvinna_3, dateFrom, dateTo } = params;

    let sql = `
      SELECT
        u.*,
        p.name as person_name,
        p.gender as person_gender,
        p.party as person_party
      FROM utterance u
      JOIN person p ON u.person_id = p.id
      WHERE 1=1
    `;

    const bindings: any[] = [];

    // Freetext search using LIKE
    if (query && query.trim()) {
      const tokens = this.tokenize(query);
      if (tokens.length > 0) {
        const likeConditions = tokens.map(() => 'u.content LIKE ?').join(' AND ');
        sql += ` AND (${likeConditions})`;
        bindings.push(...tokens.map((t) => `%${t}%`));
      }
    }

    // Party filter
    if (party && party.length > 0) {
      const placeholders = party.map(() => '?').join(',');
      sql += ` AND p.party IN (${placeholders})`;
      bindings.push(...party);
    }

    // Gender filter
    if (gender) {
      sql += ` AND LOWER(p.gender) = LOWER(?)`;
      bindings.push(gender);
    }

    // Speaker filter
    if (speaker !== undefined) {
      sql += ` AND p.id = ?`;
      bindings.push(speaker);
    }

    // kvinna_1 filter
    if (kvinna_1 !== undefined) {
      sql += ` AND u.kvinna_1 = ?`;
      bindings.push(kvinna_1 ? 1 : 0);
    }

    // kvinna_2 filter
    if (kvinna_2 !== undefined) {
      sql += ` AND u.kvinna_2 = ?`;
      bindings.push(kvinna_2 ? 1 : 0);
    }

    // kvinna_3 filter
    if (kvinna_3 !== undefined) {
      sql += ` AND u.kvinna_3 = ?`;
      bindings.push(kvinna_3 ? 1 : 0);
    }

    // Date range filter
    if (dateFrom) {
      sql += ` AND u.date >= ?`;
      bindings.push(dateFrom);
    }

    if (dateTo) {
      sql += ` AND u.date <= ?`;
      bindings.push(dateTo);
    }

    // Order by date
    sql += ` ORDER BY u.date ASC, u.id ASC`;

    // Limit results
    sql += ` LIMIT ${config.maxSearchResults}`;

    return { sql, bindings };
  }

  /**
   * Tokenize search query
   * @param query Search query
   * @returns Array of tokens
   */
  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }
}

// Export singleton instance
export const searchEngine = new SearchEngine();
