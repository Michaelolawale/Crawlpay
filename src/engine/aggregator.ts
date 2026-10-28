import { Finding, FindingGroup, PageCrawlData, Severity, SiteMetadata } from './types';
import { getStackFix } from './utils/stackDetector';

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 2,
  info: 1,
};

const SEVERITY_RANKS: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

/**
 * Calculates page importance score per spec:
 * pageImportance = homepage(3) + in sitemap(1) + depth<=1(2) + inboundInternalLinks>=10(2)
 */
export function calculatePageImportance(page: PageCrawlData, metadata: SiteMetadata): number {
  let score = 0;
  const isHomepage = page.url.toLowerCase() === metadata.baseUrl.toLowerCase() || page.depth === 0;
  if (isHomepage) score += 3;

  const inSitemap = metadata.sitemapUrls.some(
    (u) => u.toLowerCase() === page.url.toLowerCase() || u.toLowerCase() === page.finalUrl.toLowerCase()
  );
  if (inSitemap) score += 1;

  if (page.depth <= 1) score += 2;
  if (page.inboundInternalLinks >= 10) score += 2;

  return score;
}

/**
 * Groups findings by rootCauseKey, attaches stackFix, and calculates priority:
 * priority = severityWeight * log(1 + affectedCount) * (1 + pageImportance / 5)
 */
export function groupAndPrioritizeFindings(
  findings: Finding[],
  pages: PageCrawlData[],
  metadata: SiteMetadata
): { groups: FindingGroup[]; whatPassed: string } {
  const pageLookup = new Map<string, PageCrawlData>();
  for (const p of pages) {
    pageLookup.set(p.url, p);
    pageLookup.set(p.finalUrl, p);
  }

  // 1. Group by rootCauseKey
  const groupedMap = new Map<string, Finding[]>();
  for (const finding of findings) {
    const list = groupedMap.get(finding.rootCauseKey) || [];
    list.push(finding);
    groupedMap.set(finding.rootCauseKey, list);
  }

  const groups: FindingGroup[] = [];

  for (const [rootCauseKey, groupFindings] of groupedMap.entries()) {
    // Determine highest severity in group
    let highestSeverity: Severity = 'info';
    let highestRank = 0;

    for (const f of groupFindings) {
      const rank = SEVERITY_RANKS[f.severity] || 0;
      if (rank > highestRank) {
        highestRank = rank;
        highestSeverity = f.severity;
      }
    }

    // Determine max page importance among affected URLs
    let maxPageImportance = 0;
    const urlSet = new Set<string>();

    for (const f of groupFindings) {
      urlSet.add(f.url);
      const page = pageLookup.get(f.url);
      if (page) {
        const imp = calculatePageImportance(page, metadata);
        if (imp > maxPageImportance) {
          maxPageImportance = imp;
        }
      }
    }

    const affectedCount = groupFindings.length;
    const severityWeight = SEVERITY_WEIGHTS[highestSeverity] || 1;

    // Spec formula:
    // Final priority = severityWeight * Math.log(1 + affectedCount) * (1 + pageImportance / 5)
    // Note: Math.log is natural log, or Math.log10. Spec says "log(1 + affectedCount)", natural log is standard.
    const priority = severityWeight * Math.log(1 + affectedCount) * (1 + maxPageImportance / 5);

    const exampleUrls = Array.from(urlSet).slice(0, 5);
    const primaryCheckId = groupFindings[0].checkId;
    const stackFix = getStackFix(primaryCheckId, metadata.detectedStack);

    groups.push({
      rootCauseKey,
      checkId: primaryCheckId,
      severity: highestSeverity,
      priority: Math.round(priority * 100) / 100,
      affectedCount,
      totalPagesChecked: pages.length,
      exampleUrls,
      stackFix,
      findings: groupFindings,
    });
  }

  // Sort groups by priority descending
  groups.sort((a, b) => b.priority - a.priority);

  // Generate "What passed" summary line per principle 4
  const passingChecks: string[] = [];
  const checkPrefixes = [
    { prefix: 'indexability', name: 'Robots.txt & meta robots indexation' },
    { prefix: 'canonical', name: 'Canonical tag resolution' },
    { prefix: 'titles', name: 'Page titles' },
    { prefix: 'descriptions', name: 'Meta descriptions' },
    { prefix: 'headings', name: 'Heading hierarchy & H1 uniqueness' },
    { prefix: 'links', name: 'Internal link health' },
    { prefix: 'sitemap', name: 'XML sitemap parsing' },
    { prefix: 'duplicate_content', name: 'Near-duplicate body content' },
    { prefix: 'images', name: 'Image alt tags & dimensions' },
    { prefix: 'structured_data', name: 'JSON-LD schema markup' },
    { prefix: 'mobile', name: 'Mobile viewport, touch targets & responsiveness' },
  ];

  for (const item of checkPrefixes) {
    const hasIssue = groups.some((g) => g.checkId.startsWith(item.prefix));
    if (!hasIssue) {
      passingChecks.push(item.name);
    }
  }

  const whatPassed = passingChecks.length > 0
    ? `All checked pages cleanly passed: ${passingChecks.join(', ')}.`
    : 'All checked categories contained at least one actionable observation.';

  return { groups, whatPassed };
}
