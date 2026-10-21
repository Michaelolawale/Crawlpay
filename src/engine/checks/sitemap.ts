import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { generateStableFindingId, sanitizeSnippet } from '../utils/simhash';

export function checkSitemap(pages: PageCrawlData[], metadata: SiteMetadata): Finding[] {
  const findings: Finding[] = [];

  // 1. Sitemap exists check
  if (!metadata.sitemapFound) {
    findings.push({
      id: generateStableFindingId('sitemap.missing', metadata.baseUrl, 'no_sitemap'),
      checkId: 'sitemap.missing',
      severity: 'high',
      url: `${metadata.baseUrl}/sitemap.xml`,
      evidence: {
        observed: 'No valid XML sitemap could be found or parsed at /sitemap.xml or declared locations.',
        expected: 'An accessible, valid XML sitemap listing canonical indexable pages to guide search engine discovery.',
        snippet: 'GET /sitemap.xml returned 404 or non-XML response.',
      },
      rootCauseKey: 'sitemap.missing',
    });
    return findings;
  }

  // 2. Referenced in robots.txt
  const robotsTxt = metadata.robotsTxtContent || '';
  if (!robotsTxt.toLowerCase().includes('sitemap:')) {
    findings.push({
      id: generateStableFindingId('sitemap.not_in_robots', metadata.baseUrl, 'missing_directive'),
      checkId: 'sitemap.not_in_robots',
      severity: 'low',
      url: `${metadata.baseUrl}/robots.txt`,
      evidence: {
        observed: 'robots.txt does not declare a `Sitemap:` directive pointing to the XML sitemap.',
        expected: `Include 'Sitemap: ${metadata.sitemapUrl || `${metadata.baseUrl}/sitemap.xml`}' in robots.txt.`,
        snippet: sanitizeSnippet(robotsTxt, 150) || 'robots.txt has no Sitemap entry',
      },
      rootCauseKey: 'sitemap.not_in_robots',
    });
  }

  // Build lookups
  const sitemapUrls = new Set(metadata.sitemapUrls.map((u) => u.toLowerCase()));
  const crawledPages = new Map<string, PageCrawlData>();
  for (const page of pages) {
    crawledPages.set(page.url.toLowerCase(), page);
    crawledPages.set(page.finalUrl.toLowerCase(), page);
  }

  // 3. Important crawled pages missing from sitemap (depth <= 1, indexable, 200 OK)
  for (const page of pages) {
    if (page.depth <= 1 && page.status === 200) {
      const isNoindex = page.robotsMeta.toLowerCase().includes('noindex');
      if (!isNoindex && !sitemapUrls.has(page.url.toLowerCase()) && !sitemapUrls.has(page.finalUrl.toLowerCase())) {
        findings.push({
          id: generateStableFindingId('sitemap.missing_important_page', page.url, 'not_in_sitemap'),
          checkId: 'sitemap.missing_important_page',
          severity: 'medium',
          url: page.url,
          evidence: {
            observed: `High-priority top-level page '${page.url}' (depth ${page.depth}) is absent from sitemap.xml.`,
            expected: 'All core public, indexable navigation pages should be submitted in the XML sitemap.',
            snippet: `Crawled indexable URL not present in sitemap (${metadata.sitemapUrls.length} total URLs in sitemap).`,
          },
          rootCauseKey: 'sitemap.missing_important_page',
        });
      }
    }
  }

  return findings;
}
