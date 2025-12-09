import { config } from '../utils/config';
import { decompressGzip, isGzipped } from '../utils/compression';

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type ProgressCallback = (progress: LoadProgress) => void;

/**
 * Database Loader
 * Handles fetching and decompressing database files
 */
export class DatabaseLoader {
  /**
   * Fetch a database file from the network
   * @param year Year of the database to fetch
   * @param onProgress Optional progress callback
   * @returns Decompressed database as Uint8Array
   */
  async fetchDatabase(
    year: number,
    onProgress?: ProgressCallback
  ): Promise<Uint8Array> {
    const url = config.databaseUrl(year);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Stream the response and track progress
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (onProgress && total > 0) {
          onProgress({
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100),
          });
        }
      }

      // Concatenate all chunks
      const data = new Uint8Array(loaded);
      let position = 0;
      for (const chunk of chunks) {
        data.set(chunk, position);
        position += chunk.length;
      }

      // Decompress if gzipped
      if (isGzipped(data)) {
        return decompressGzip(data);
      }

      return data;
    } catch (error) {
      throw new Error(
        `Failed to load database for year ${year}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}

// Singleton instance
export const databaseLoader = new DatabaseLoader();
