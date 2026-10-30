import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { generateStableFindingId, sanitizeSnippet } from '../utils/simhash';
import { RobotsParser } from '../utils/robotsParser';

export function checkIndexability(
  pages: PageCrawlData[],
  metadata: SiteMetadata,
  robotsParser: RobotsParser
): Finding[] {
  const findings: Finding[] = [];
  const sitemapUrlSet = new Set(metadata.sitemapUrls.map((u) => u.toLowerCase()));

  // 1. Check robots.txt Disallow rules blocking critical paths
  const disallowedRules = robotsParser.getDisallowedRules();
  const criticalPrefixes = ['/', '/blog', '/services', '/products', '/about'];

  for (const rule of disallowedRules) {
    if (rule === '/') {
      findings.push({
        id: generateStableFindingId('indexability.robots_disallow_all', metadata.baseUrl, rule),
        checkId: 'indexability.robots_disallow_all',
        severity: 'critical',
        url: `${metadata.baseUrl}/robots.txt`,
        evidence: {
          observed: `robots.txt contains 'Disallow: /', blocking all web crawlers from indexing the entire website.`,
          expected: 'Allow crawlers to access public indexable pages, only disallowing private or admin routes.',
          snippet: sanitizeSnippet(robotsParser.getRaw() || '', 250),
        },
        rootCauseKey: 'indexability.robots_disallow_all',
      });
    } else {
      for (const prefix of criticalPrefixes) {
        if (rule === prefix || rule === `${prefix}/`) {
          findings.push({
            id: generateStableFindingId('indexability.robots_disallow_key_path', metadata.baseUrl, rule),
            checkId: 'indexability.robots_disallow_key_path',
            severity: 'high',
            url: `${metadata.baseUrl}/robots.txt`,
            evidence: {
              observed: `robots.txt contains 'Disallow: ${rule}', blocking search crawlers from accessing important section '${prefix}'.`,
              expected: `Ensure important public pathways like '${prefix}' are crawlable.`,
              snippet: sanitizeSnippet(robotsParser.getRaw() || '', 250),
            },
            rootCauseKey: `indexability.robots_disallow::${rule}`,
          });
        }
      }
    }
  }

  // 2. Page-level indexability checks
  for (const page of pages) {
    const robotsMetaLower = page.robotsMeta.toLowerCase();
    const isNoindex = robotsMetaLower.includes('noindex');
    const inSitemap = sitemapUrlSet.has(page.url.toLowerCase()) || sitemapUrlSet.has(page.finalUrl.toLowerCase());

    if (isNoindex) {
      if (inSitemap) {
        findings.push({
          id: generateStableFindingId('indexability.noindex_in_sitemap', page.url, page.robotsMeta),
          checkId: 'indexability.noindex_in_sitemap',
          severity: 'critical',
          url: page.url,
          evidence: {
            observed: `Page declared with 'noindex' in meta robots/X-Robots-Tag ('${page.robotsMeta}'), but is explicitly listed in sitemap.xml.`,
            expected: 'Pages listed in sitemap.xml must be public and indexable (without noindex directive).',
            snippet: sanitizeSnippet(page.robotsMeta || 'X-Robots-Tag: noindex', 200),
          },
          rootCauseKey: 'indexability.noindex_in_sitemap',
        });
      } else {
        findings.push({
          id: generateStableFindingId('indexability.noindex', page.url, page.robotsMeta),
          checkId: 'indexability.noindex',
          severity: 'medium',
          url: page.url,
          evidence: {
            observed: `Page has 'noindex' directive: '${page.robotsMeta}'.`,
            expected: 'Only internal staging, search result, or private pages should have noindex tags.',
            snippet: sanitizeSnippet(page.robotsMeta, 150),
          },
          rootCauseKey: 'indexability.noindex',
        });
      }
    }

    // 3. Blocked by robots.txt but linked internally
    try {
      const pathname = new URL(page.url).pathname;
      if (!robotsParser.isAllowed(pathname) && page.inboundInternalLinks > 0) {
        findings.push({
          id: generateStableFindingId('indexability.blocked_by_robots_internally_linked', page.url, pathname),
          checkId: 'indexability.blocked_by_robots_internally_linked',
          severity: 'high',
          url: page.url,
          evidence: {
            observed: `Path '${pathname}' is blocked by robots.txt but received ${page.inboundInternalLinks} internal link(s) from crawled pages.`,
            expected: 'Internal links should only point to crawlable URLs, or remove the robots.txt disallow rule if intended for indexation.',
            snippet: `Inbound internal links: ${page.inboundInternalLinks}`,
          },
          rootCauseKey: `indexability.blocked_by_robots_internally_linked::${pathname.split('/')[1] || 'root'}`,
        });
      }
    } catch {}

    // 4. Client-side rendered warning (info severity per spec)
    if (page.isClientRendered) {
      findings.push({
        id: generateStableFindingId('indexability.client_rendered', page.url, 'csr_detected'),
        checkId: 'indexability.client_rendered',
        severity: 'info',
        url: page.url,
        evidence: {
          observed: 'Content likely rendered client-side (minimal body text with hydration root div / __NEXT_DATA__). Results for this page may be incomplete in static crawl.',
          expected: 'Pre-render critical content with Server-Side Rendering (SSR) or Static Site Generation (SSG) for full search bot accessibility.',
          snippet: 'Hydration root element detected with < 250 characters of static text content.',
        },
        rootCauseKey: 'indexability.client_rendered',
      });
    }
  }

  return findings;
}
