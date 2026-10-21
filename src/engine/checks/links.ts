import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { generateStableFindingId, sanitizeSnippet } from '../utils/simhash';

const GENERIC_ANCHORS = new Set([
  'click here',
  'read more',
  'learn more',
  'here',
  'link',
  'more',
  'view more',
  'go',
  'this page',
  'details',
]);

export function checkLinks(pages: PageCrawlData[], metadata: SiteMetadata): Finding[] {
  const findings: Finding[] = [];
  const statusMap = new Map<string, number>();

  for (const page of pages) {
    statusMap.set(page.url.toLowerCase(), page.status);
    statusMap.set(page.finalUrl.toLowerCase(), page.status);
  }

  const sitemapUrlSet = new Set(metadata.sitemapUrls.map((u) => u.toLowerCase()));

  for (const page of pages) {
    // 1. Check page links
    for (const link of page.links) {
      const anchorLower = link.anchorText.toLowerCase();

      // Empty or Generic Anchor Text
      if (link.anchorText.length === 0) {
        findings.push({
          id: generateStableFindingId('links.empty_anchor', page.url, link.href),
          checkId: 'links.empty_anchor',
          severity: 'low',
          url: page.url,
          evidence: {
            observed: `Internal/external link to '${link.href}' has no anchor text.`,
            expected: 'All links must have descriptive anchor text for accessibility and search engine link-graph comprehension.',
            snippet: `<a href="${link.href}"></a>`,
          },
          rootCauseKey: 'links.empty_anchor',
        });
      } else if (GENERIC_ANCHORS.has(anchorLower)) {
        findings.push({
          id: generateStableFindingId('links.generic_anchor', page.url, `${link.href}|${anchorLower}`),
          checkId: 'links.generic_anchor',
          severity: 'low',
          url: page.url,
          evidence: {
            observed: `Generic, uninformative anchor text: "${link.anchorText}" pointing to '${link.href}'.`,
            expected: 'Use keyword-rich, contextual anchor text conveying destination content topic.',
            snippet: `<a href="${link.href}">${link.anchorText}</a>`,
          },
          rootCauseKey: `links.generic_anchor::"${anchorLower}"`,
        });
      }

      // nofollow on internal links
      if (link.isInternal && link.rel.toLowerCase().includes('nofollow')) {
        findings.push({
          id: generateStableFindingId('links.internal_nofollow', page.url, link.href),
          checkId: 'links.internal_nofollow',
          severity: 'medium',
          url: page.url,
          evidence: {
            observed: `Internal link carries rel="nofollow": points to '${link.href}'.`,
            expected: 'Internal links should pass PageRank equity and allow crawler discovery without nofollow attributes.',
            snippet: `<a href="${link.href}" rel="${link.rel}">${sanitizeSnippet(link.anchorText, 60)}</a>`,
          },
          rootCauseKey: 'links.internal_nofollow',
        });
      }

      // Broken Internal Links (4xx/5xx)
      if (link.isInternal) {
        const destStatus = statusMap.get(link.resolvedUrl.toLowerCase());
        if (destStatus && destStatus >= 400) {
          findings.push({
            id: generateStableFindingId('links.broken_internal', page.url, link.resolvedUrl),
            checkId: 'links.broken_internal',
            severity: page.depth === 0 ? 'high' : 'medium',
            url: page.url,
            evidence: {
              observed: `Internal link with anchor text "${link.anchorText || 'N/A'}" returns HTTP ${destStatus}. Target: '${link.resolvedUrl}'.`,
              expected: 'Internal links must resolve to HTTP 200 OK.',
              snippet: `<a href="${link.href}">${sanitizeSnippet(link.anchorText, 60)}</a> -> HTTP ${destStatus}`,
            },
            rootCauseKey: `links.broken_internal::HTTP_${destStatus}`,
          });
        }
      }
    }

    // 2. Orphan Pages (in sitemap, zero inbound internal links)
    const inSitemap = sitemapUrlSet.has(page.url.toLowerCase());
    if (inSitemap && page.depth > 0 && page.inboundInternalLinks === 0) {
      findings.push({
        id: generateStableFindingId('links.orphan_page', page.url, 'zero_inbound'),
        checkId: 'links.orphan_page',
        severity: 'medium',
        url: page.url,
        evidence: {
          observed: `Page is in sitemap.xml but has 0 inbound internal links from other crawled site pages.`,
          expected: 'Every indexable page in the sitemap should be reachable via the site navigation or contextual internal links.',
          snippet: `Inbound internal links: 0 (listed in sitemap)`,
        },
        rootCauseKey: 'links.orphan_page',
      });
    }
  }

  return findings;
}
