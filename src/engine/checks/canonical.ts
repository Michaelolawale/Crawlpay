import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { generateStableFindingId, sanitizeSnippet } from '../utils/simhash';

export function checkCanonicals(pages: PageCrawlData[], metadata: SiteMetadata): Finding[] {
  const findings: Finding[] = [];
  const pageMap = new Map<string, PageCrawlData>();
  for (const page of pages) {
    pageMap.set(page.url.toLowerCase(), page);
    pageMap.set(page.finalUrl.toLowerCase(), page);
  }

  const sitemapUrlSet = new Set(metadata.sitemapUrls.map((u) => u.toLowerCase()));

  for (const page of pages) {
    const rawCanonical = page.canonical.trim();

    // 1. Missing canonical
    if (!rawCanonical) {
      findings.push({
        id: generateStableFindingId('canonical.missing', page.url, 'empty'),
        checkId: 'canonical.missing',
        severity: 'medium',
        url: page.url,
        evidence: {
          observed: 'No <link rel="canonical"> tag found on this page.',
          expected: `<link rel="canonical" href="${page.url}"> to consolidate duplicate signals and specify preferred URL.`,
          snippet: '<link rel="canonical"> tag is absent from HTML <head>.',
        },
        rootCauseKey: 'canonical.missing',
      });
      continue;
    }

    // 2. Relative vs Absolute inconsistency
    if (!rawCanonical.startsWith('http://') && !rawCanonical.startsWith('https://')) {
      findings.push({
        id: generateStableFindingId('canonical.relative_url', page.url, rawCanonical),
        checkId: 'canonical.relative_url',
        severity: 'medium',
        url: page.url,
        evidence: {
          observed: `Canonical URL uses relative format: '${rawCanonical}'.`,
          expected: `Canonical links must be absolute URLs with protocol and domain (e.g., '${new URL(rawCanonical, page.url).href}').`,
          snippet: `<link rel="canonical" href="${rawCanonical}">`,
        },
        rootCauseKey: 'canonical.relative_url',
      });
    }

    let parsedCanonical: URL;
    try {
      parsedCanonical = new URL(rawCanonical, page.url);
    } catch {
      findings.push({
        id: generateStableFindingId('canonical.malformed', page.url, rawCanonical),
        checkId: 'canonical.malformed',
        severity: 'high',
        url: page.url,
        evidence: {
          observed: `Malformed canonical href: '${rawCanonical}'.`,
          expected: 'A valid absolute RFC-compliant URL.',
          snippet: `<link rel="canonical" href="${rawCanonical}">`,
        },
        rootCauseKey: 'canonical.malformed',
      });
      continue;
    }

    const canonicalHref = parsedCanonical.href;

    // 3. Canonical pointing to a different domain (cross-domain)
    if (parsedCanonical.hostname.toLowerCase() !== metadata.hostname.toLowerCase()) {
      findings.push({
        id: generateStableFindingId('canonical.external_domain', page.url, parsedCanonical.hostname),
        checkId: 'canonical.external_domain',
        severity: 'medium',
        url: page.url,
        evidence: {
          observed: `Canonical points across domains to external host '${parsedCanonical.hostname}'.`,
          expected: `Internal page canonicals should typically point to '${metadata.hostname}' unless syndicate content is intended.`,
          snippet: `<link rel="canonical" href="${canonicalHref}">`,
        },
        rootCauseKey: `canonical.external_domain::${parsedCanonical.hostname}`,
      });
    }

    // 4. Canonical pointing to a known 4xx / 5xx error
    const targetPage = pageMap.get(canonicalHref.toLowerCase());
    if (targetPage && targetPage.status >= 400) {
      findings.push({
        id: generateStableFindingId('canonical.points_to_broken', page.url, canonicalHref),
        checkId: 'canonical.points_to_broken',
        severity: 'high',
        url: page.url,
        evidence: {
          observed: `Canonical points to broken URL returning HTTP ${targetPage.status}: '${canonicalHref}'.`,
          expected: 'Canonical must point to a 200 OK indexable page.',
          snippet: `<link rel="canonical" href="${canonicalHref}"> (HTTP ${targetPage.status})`,
        },
        rootCauseKey: 'canonical.points_to_broken',
      });
    }

    // 5. Canonical conflicting with sitemap URL
    if (sitemapUrlSet.has(page.url.toLowerCase())) {
      const canonicalLower = canonicalHref.toLowerCase();
      const pageLower = page.url.toLowerCase();
      if (canonicalLower !== pageLower && canonicalLower !== `${pageLower}/` && `${canonicalLower}/` !== pageLower) {
        findings.push({
          id: generateStableFindingId('canonical.sitemap_conflict', page.url, canonicalHref),
          checkId: 'canonical.sitemap_conflict',
          severity: 'high',
          url: page.url,
          evidence: {
            observed: `Page is in sitemap.xml as '${page.url}' but self-declares canonical pointing elsewhere: '${canonicalHref}'.`,
            expected: 'Sitemap.xml should only contain canonical URLs to avoid indexation conflicts.',
            snippet: `Sitemap entry: ${page.url} != Canonical: ${canonicalHref}`,
          },
          rootCauseKey: 'canonical.sitemap_conflict',
        });
      }
    }
  }

  return findings;
}
