import pako from 'pako';

/**
 * Decompress gzip data
 * @param data Compressed gzip data as Uint8Array
 * @returns Decompressed data as Uint8Array
 */
export function decompressGzip(data: Uint8Array): Uint8Array {
  try {
    return pako.ungzip(data);
  } catch (error) {
    throw new Error(`Failed to decompress gzip data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if data is gzipped
 * @param data Data to check
 * @returns true if data starts with gzip magic number
 */
export function isGzipped(data: Uint8Array): boolean {
  // Gzip magic number: 0x1f 0x8b
  return data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
}
