export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface FindingEvidence {
  observed: string;        // what we found, with snippet or value
  expected: string;        // what should be there
  snippet?: string;        // sanitized, max 300 chars
}

export interface Finding {
  id: string;                // stable: checkId + hash(url + evidence key)
  checkId: string;           // e.g. "canonical.missing"
  severity: Severity;
  url: string;
  evidence: FindingEvidence;
  rootCauseKey: string;      // checkId + URL pattern or template signature
}

export interface FindingGroup {
  rootCauseKey: string;
  checkId: string;
  severity: Severity;        // highest in group
  priority: number;          // calculated severityWeight * log(1+count) * (1+pageImportance/5)
  affectedCount: number;
  totalPagesChecked: number;
  exampleUrls: string[];     // max 5
  stackFix?: string;         // tailored to detected stack
  findings: Finding[];
}

export interface CrawledLink {
  href: string;
  resolvedUrl: string;
  anchorText: string;
  rel: string;
  isInternal: boolean;
}

export interface CrawledImage {
  src: string;
  alt: string;
  bytes?: number;
  width?: number;
  height?: number;
  isDecorative: boolean;
}

export interface PageCrawlData {
  url: string;
  finalUrl: string;
  status: number;
  redirectChain: string[];
  headers: Record<string, string>;
  html: string;
  title: string;
  metaDescription: string;
  canonical: string;
  robotsMeta: string;
  h1ToH6: {
    h1s: string[];
    h2s: string[];
    h3s: string[];
    h4s: string[];
    h5s: string[];
    h6s: string[];
    hierarchy: Array<{ level: number; text: string }>;
  };
  links: CrawledLink[];
  images: CrawledImage[];
  jsonLd: any[];
  textHash: string; // 64-bit simhash of visible body text
  depth: number;
  inboundInternalLinks: number;
  isClientRendered: boolean;
  byteSize: number;
}

export interface CrawlConfig {
  mode: 'quick' | 'full';
  maxPages: number;         // quick: 1, full: up to 50
  maxDepth: number;         // default <= 3
  maxResponseBytes: number; // 2 MB (2 * 1024 * 1024)
  totalTimeoutMs: number;   // 60s per audit
  perRequestTimeoutMs: number;
  requestsPerSecond: number;// max 2 req/s per host
  userAgent: string;
}

export interface SiteMetadata {
  baseUrl: string;
  hostname: string;
  detectedStack: {
    cms?: 'WordPress' | 'Shopify' | 'Wix' | 'Squarespace' | 'Next.js' | 'Unknown';
    seoPlugin?: 'Yoast' | 'RankMath' | 'None';
    framework?: string;
  };
  sitemapFound: boolean;
  sitemapUrl?: string;
  sitemapUrls: string[];
  robotsTxtFound: boolean;
  robotsTxtContent?: string;
}

export interface PriorityItem {
  rootCauseKey: string;
  whyItMatters: string;
  fix: string;
  effort: 'low' | 'medium' | 'high';
}

export interface LlmAuditSummary {
  summary: string; // <= 120 words
  priorities: PriorityItem[];
}

export interface SeoAuditReport {
  summary: string;
  meta: {
    targetUrl: string;
    auditTimestamp: string;
    mode: 'quick' | 'full';
    pagesChecked: number;
    detectedStack: SiteMetadata['detectedStack'];
    durationMs: number;
  };
  prioritizedGroups: FindingGroup[];
  prioritiesFromLlm?: PriorityItem[];
  whatPassed: string;
  notChecked: string[];
  allFindings: Finding[];
}
