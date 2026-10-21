import crypto from 'crypto';

/**
 * 64-bit Simhash implementation to identify near-duplicate content
 */
export function calculateSimhash(text: string): string {
  // Normalize text: lowercase, remove punctuation, extract word tokens
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) {
    return '0'.repeat(64);
  }

  // Count word frequencies
  const freqMap: Record<string, number> = {};
  for (const word of words) {
    freqMap[word] = (freqMap[word] || 0) + 1;
  }

  const v = new Array(64).fill(0);

  for (const [word, weight] of Object.entries(freqMap)) {
    const hash = crypto.createHash('md5').update(word).digest('hex');
    // Take first 16 hex chars (64 bits)
    const hex64 = hash.substring(0, 16);
    const bigIntVal = BigInt('0x' + hex64);

    for (let i = 0; i < 64; i++) {
      const bit = (bigIntVal >> BigInt(i)) & 1n;
      if (bit === 1n) {
        v[i] += weight;
      } else {
        v[i] -= weight;
      }
    }
  }

  let fingerprint = '';
  for (let i = 63; i >= 0; i--) {
    fingerprint += v[i] > 0 ? '1' : '0';
  }

  return fingerprint;
}

/**
 * Calculates Hamming distance between two 64-bit binary strings
 */
export function hammingDistance(hashA: string, hashB: string): number {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 64;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) {
      distance++;
    }
  }
  return distance;
}

/**
 * Creates a stable deterministic ID for a finding: checkId + hash(url + evidenceKey)
 */
export function generateStableFindingId(checkId: string, url: string, evidenceKey: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${url}|${evidenceKey}`)
    .digest('hex')
    .slice(0, 12);
  return `${checkId}.${hash}`;
}

/**
 * Sanitizes and truncates a snippet for evidence to max 300 characters
 */
export function sanitizeSnippet(raw: string, maxLen: number = 300): string {
  if (!raw) return '';
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen - 3) + '...';
}
