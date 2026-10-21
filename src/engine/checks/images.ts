import { Finding, PageCrawlData } from '../types';
import { generateStableFindingId, sanitizeSnippet } from '../utils/simhash';

export function checkImages(pages: PageCrawlData[]): Finding[] {
  const findings: Finding[] = [];

  for (const page of pages) {
    const template = new URL(page.url).pathname.split('/')[1] || 'root';

    for (const img of page.images) {
      const srcLower = img.src.toLowerCase();

      // 1. Missing alt on non-decorative images
      if (!img.isDecorative && img.alt === '') {
        findings.push({
          id: generateStableFindingId('images.missing_alt', page.url, img.src),
          checkId: 'images.missing_alt',
          severity: 'medium',
          url: page.url,
          evidence: {
            observed: `Image is missing an alt attribute: src="${img.src}".`,
            expected: 'All informative images must include descriptive alt text for accessibility and image search indexing.',
            snippet: `<img src="${sanitizeSnippet(img.src, 120)}"> (alt missing)`,
          },
          rootCauseKey: `images.missing_alt::/${template}`,
        });
      }

      // 2. Missing width or height (CLS risk)
      if (img.width === undefined || img.height === undefined) {
        findings.push({
          id: generateStableFindingId('images.missing_dimensions', page.url, img.src),
          checkId: 'images.missing_dimensions',
          severity: 'low',
          url: page.url,
          evidence: {
            observed: `Image lacks explicit width/height dimensions (width: ${img.width ?? 'missing'}, height: ${img.height ?? 'missing'}).`,
            expected: 'Provide explicit width and height HTML attributes or CSS aspect-ratio to prevent Cumulative Layout Shift (CLS).',
            snippet: `<img src="${sanitizeSnippet(img.src, 100)}" ...>`,
          },
          rootCauseKey: `images.missing_dimensions::/${template}`,
        });
      }

      // 3. Legacy formats where WebP/AVIF would help
      if (srcLower.endsWith('.png') || srcLower.endsWith('.jpg') || srcLower.endsWith('.jpeg')) {
        findings.push({
          id: generateStableFindingId('images.legacy_format', page.url, img.src),
          checkId: 'images.legacy_format',
          severity: 'low',
          url: page.url,
          evidence: {
            observed: `Image served in legacy format: '${img.src}'.`,
            expected: 'Convert images to modern formats like WebP or AVIF for 25%–35% smaller file sizes with equal visual fidelity.',
            snippet: `<img src="${sanitizeSnippet(img.src, 120)}">`,
          },
          rootCauseKey: `images.legacy_format::/${template}`,
        });
      }
    }
  }

  return findings;
}
