import crypto from 'crypto';

/**
 * Generate a SHA-256 content hash for caching embeddings
 * Normalizes text before hashing to ensure cache hits for equivalent content
 *
 * @param text - Text content to hash
 * @returns SHA-256 hash (hex string)
 */
export function getContentHash(text: string): string {
  // Normalize text: trim, lowercase, collapse whitespace
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  // Generate SHA-256 hash
  return crypto
    .createHash('sha256')
    .update(normalized, 'utf8')
    .digest('hex');
}
