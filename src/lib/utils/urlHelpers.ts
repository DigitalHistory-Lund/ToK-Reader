/**
 * Parse date from YYYYMMDD integer format to readable string
 * @param date Date as YYYYMMDD integer
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDate(date: number): string {
  const dateStr = date.toString();
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return `${year}-${month}-${day}`;
}

/**
 * Parse date from YYYYMMDD integer to Date object
 * @param date Date as YYYYMMDD integer
 * @returns Date object
 */
export function parseDate(date: number): Date {
  const dateStr = date.toString();
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(dateStr.slice(6, 8));
  return new Date(year, month, day);
}

/**
 * Truncate text to a maximum length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Create a text snippet with context around a query match
 * @param text Full text
 * @param query Search query
 * @param contextLength Characters of context on each side
 * @returns Snippet with query highlighted
 */
export function createSnippet(text: string, query: string, contextLength: number = 100): string {
  if (!query) return truncateText(text, contextLength * 2);

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return truncateText(text, contextLength * 2);

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + query.length + contextLength);

  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Debounce function
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Normalize party name for consistent lookup
 * @param party Party name
 * @returns Normalized party name
 */
export function normalizePartyName(party: string | null): string {
  if (!party) return 'default';
  return party.toLowerCase().replace(/\s+/g, '').replace(/ä/g, 'a').replace(/ö/g, 'o');
}
