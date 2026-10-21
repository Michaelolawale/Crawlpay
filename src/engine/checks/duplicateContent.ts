import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { generateStableFindingId, hammingDistance } from '../utils/simhash';

export async function checkDuplicateContent(
  pages: PageCrawlData[],
  metadata: SiteMetadata
): Promise<Finding[]> {
  const findings: Finding[] = [];

  // 1. Simhash near-duplicate text detection (Hamming distance <= 3)
  const n = pages.length;
  const processedPairs = new Set<string>();

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const pageA = pages[i];
      const pageB = pages[j];

      // Skip empty hashes
      if (pageA.textHash === '0'.repeat(64) || pageB.textHash === '0'.repeat(64)) {
        continue;
      }

      const distance = hammingDistance(pageA.textHash, pageB.textHash);
      if (distance <= 3) {
        const pairKey = [pageA.url, pageB.url].sort().join('|');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);

          // Group by template pattern
          const pathA = new URL(pageA.url).pathname.split('/')[1] || 'root';
          const rootCauseKey = `duplicate_content.near_duplicate_body::/${pathA}`;

          findings.push({
            id: generateStableFindingId('duplicate_content.near_duplicate_body', pageA.url, pageB.url),
            checkId: 'duplicate_content.near_duplicate_body',
            severity: 'medium',
            url: pageA.url,
            evidence: {
              observed: `Near-duplicate body content detected (Simhash Hamming distance ${distance}/64) with '${pageB.url}'.`,
              expected: 'Each indexable URL should offer distinct, substantially differentiated copy to prevent thin content penalties.',
              snippet: `Shared text fingerprint match with ${pageB.url}`,
            },
            rootCauseKey,
          });
        }
      }
    }
  }

  // 2. HTTP/HTTPS or WWW/Non-WWW canonical resolution check on homepage
  try {
    const originUrl = new URL(metadata.baseUrl);
    const isHttps = originUrl.protocol === 'https:';
    const isWww = originUrl.hostname.startsWith('www.');

    // Candidate variant: alternate www vs non-www
    const altHost = isWww ? originUrl.hostname.replace(/^www\./, '') : `www.${originUrl.hostname}`;
    const altVariantUrl = `${originUrl.protocol}//${altHost}/`;

    try {
      const res = await fetch(altVariantUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(3000),
      });

      // If status is 200 instead of 301/308 redirect, flag canonical split
      if (res.status === 200) {
        findings.push({
          id: generateStableFindingId('duplicate_content.www_split', metadata.baseUrl, altHost),
          checkId: 'duplicate_content.www_split',
          severity: 'medium',
          url: metadata.baseUrl,
          evidence: {
            observed: `Both '${metadata.baseUrl}' and '${altVariantUrl}' return HTTP 200 without a 301 permanent redirect.`,
            expected: `301 redirect one variant to the canonical version (e.g., '${altVariantUrl}' -> '${metadata.baseUrl}').`,
            snippet: `${altVariantUrl} returns HTTP 200 OK directly.`,
          },
          rootCauseKey: 'duplicate_content.www_split',
        });
      }
    } catch {
      // DNS or network timeout on alternate host is normal if not configured
    }
  } catch {}

  return findings;
}
