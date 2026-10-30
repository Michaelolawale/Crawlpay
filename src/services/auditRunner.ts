import * as cheerio from 'cheerio';
import { buyCoordinator } from './buyClient';
import { detectSiteArchetype } from '../analyzer/archetypeDetector';
import { parseTechnicalSeo } from '../analyzer/seoParser';
import { auditSemantics } from '../analyzer/semanticAuditor';
import { auditSpeedVitals } from '../analyzer/speedVitals';
import { generateCodePatches } from '../analyzer/fixGenerator';
import { FullAuditReport } from '../types/audit';
import { validateAndNormalizeTargetUrl } from '../utils/security';
import { PageCrawler } from '../crawler/pageCrawler';
import { runAllChecks } from '../engine/checks';
import { groupAndPrioritizeFindings } from '../engine/aggregator';
import { summarizeAuditWithLlm } from '../engine/llmLayer';

import { DynamicConfig } from './db';

/**
 * Execute a complete deterministic technical audit on a target URL
 * compliant with the Check Engine Specification (10 checks, root cause grouping, Zod LLM layer)
 */
export async function runAuditPipeline(
  targetUrl: string,
  mode: 'quick' | 'full' = 'quick',
  isPaidExecution: boolean = false,
  dynamicConfig?: DynamicConfig
): Promise<FullAuditReport> {
  const validation = await validateAndNormalizeTargetUrl(targetUrl);
  if (!validation.valid || !validation.normalizedUrl) {
    throw new Error(validation.error || 'Invalid or prohibited target URL (SSRF Protection)');
  }

  const normalizedUrl = validation.normalizedUrl;

  // 1. Run BFS Crawler with multi-page discovery (5 pages for Quick, up to dynamicConfig.max_pages_full for Full)
  const maxPages = mode === 'full' ? (dynamicConfig?.max_pages_full || 50) : 5;
  const totalTimeoutMs = dynamicConfig?.crawl_timeout_ms ? Math.max(dynamicConfig.crawl_timeout_ms * 4, 15000) : 60000;

  const crawler = new PageCrawler({
    mode,
    maxPages,
    maxDepth: mode === 'full' ? 3 : 2,
    maxResponseBytes: 2 * 1024 * 1024,
    totalTimeoutMs,
    requestsPerSecond: 4,
    userAgent: 'CrawlPayBot/1.0 (+https://crawlpay.org/bot)',
  });

  const crawlResult = await crawler.crawl(normalizedUrl);
  const { pages, metadata, robotsParser } = crawlResult;

  // Root page data for single-page DOM analysis
  const rootPage = pages[0] || {
    url: normalizedUrl,
    finalUrl: normalizedUrl,
    status: 200,
    redirectChain: [],
    headers: {},
    html: `<!DOCTYPE html><html><head><title>${normalizedUrl}</title></head><body><h1>${normalizedUrl}</h1></body></html>`,
    title: normalizedUrl,
    metaDescription: '',
    canonical: normalizedUrl,
    robotsMeta: '',
    h1ToH6: { h1s: [normalizedUrl], h2s: [], h3s: [], h4s: [], h5s: [], h6s: [], hierarchy: [] },
    links: [],
    images: [],
    jsonLd: [],
    textHash: '',
    depth: 0,
    inboundInternalLinks: 0,
    isClientRendered: false,
    byteSize: 1024,
  };

  const $ = cheerio.load(rootPage.html);

  // 2. Run the deterministic checks (including mobile performance, AEO & GEO)
  const { findings, notChecked, mobileMetrics, aeoSignals, geoSignals } = await runAllChecks(pages, metadata, robotsParser);

  // 3. Group by root cause, compute page importance & priorities, attach stackFix
  const { groups, whatPassed } = groupAndPrioritizeFindings(findings, pages, metadata);

  // 4. Summarize and prioritize via Zod-guarded LLM layer
  const llmResult = await summarizeAuditWithLlm(groups, metadata);

  // 5. Archetype & Semantics
  const archetype = detectSiteArchetype($, rootPage.html, normalizedUrl);
  const technical = parseTechnicalSeo($, normalizedUrl);
  const semantics = auditSemantics($, archetype.type, technical.headings.h1s, technical.title);
  const performance = auditSpeedVitals($, rootPage.html.length);
  const codePatches = generateCodePatches(normalizedUrl, technical, archetype, metadata.detectedStack);

  // 6. Upstream x402 payment & receipt via buy coordinator on Celo Mainnet (concurrent for low latency)
  const [browserReceipt, socialReceipt] = await Promise.all([
    buyCoordinator.rentBrowserSession(normalizedUrl, isPaidExecution),
    buyCoordinator.querySocialSignals(metadata.hostname, isPaidExecution),
  ]);
  const onchainReceipt = buyCoordinator.buildExecutionLog(normalizedUrl, browserReceipt, socialReceipt);

  // 7. Calculate scores from deterministic findings
  const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
  const highFindings = findings.filter((f) => f.severity === 'high').length;
  const mediumFindings = findings.filter((f) => f.severity === 'medium').length;

  let overallScore = 100 - (criticalFindings * 20 + highFindings * 10 + mediumFindings * 5);
  overallScore = Math.max(30, Math.min(100, overallScore));

  let technicalScore = 100 - (findings.filter((f) => f.checkId.startsWith('canonical') || f.checkId.startsWith('indexability') || f.checkId.startsWith('sitemap')).length * 15);
  technicalScore = Math.max(35, Math.min(100, technicalScore));

  let contentScore = 100 - (findings.filter((f) => f.checkId.startsWith('titles') || f.checkId.startsWith('headings') || f.checkId.startsWith('descriptions')).length * 12);
  contentScore = Math.max(40, Math.min(100, contentScore));

  const mobileFindingsCount = findings.filter((f) => f.checkId.startsWith('mobile')).length;
  const mobileScore = mobileMetrics?.mobileScore ?? Math.max(35, 100 - mobileFindingsCount * 15);

  // AEO Score calculation
  let aeoDeductions = 0;
  for (const f of findings) {
    if (f.checkId === 'aeo.question_headings') aeoDeductions += 15;
    else if (f.checkId === 'aeo.faq_schema') aeoDeductions += 10;
    else if (f.checkId === 'aeo.structured_answers') aeoDeductions += 10;
  }
  const aeoScore = Math.max(35, Math.min(100, 100 - aeoDeductions));

  // GEO Score calculation (AI Search Readiness)
  let geoDeductions = 0;
  let unknownChecksCount = 0;
  for (const f of findings) {
    if (f.checkId === 'geo.ai_bot_access') geoDeductions += 25;
    else if (f.checkId === 'geo.waf_probe') geoDeductions += 20;
    else if (f.checkId === 'geo.client_render_barrier') geoDeductions += 25;
    else if (f.checkId === 'geo.entity_declared') geoDeductions += 15;
    else if (f.checkId === 'geo.authorship_freshness') geoDeductions += 10;
  }
  if (geoSignals?.aiBots.some((b) => b.status === 'unknown')) {
    unknownChecksCount++;
  }
  const geoScore = Math.max(35, Math.min(100, 100 - geoDeductions));

  const totalCheckFamilies = 13;
  const evaluatedChecks = totalCheckFamilies - unknownChecksCount;
  const coveragePercentage = Math.round((evaluatedChecks / totalCheckFamilies) * 100);

  // 8. Map Top Needle Movers directly from highest priority FindingGroups
  const topNeedleMovers: Array<{ priority: 'Critical' | 'High' | 'Quick Win'; title: string; description: string; action: string; snippet?: string }> = [];

  for (const group of groups.slice(0, 3)) {
    const p = group.severity === 'critical' ? 'Critical' : group.severity === 'high' ? 'High' : 'Quick Win';
    const sample = group.findings[0];
    topNeedleMovers.push({
      priority: p,
      title: group.checkId,
      description: sample ? sample.evidence.observed : `Affects ${group.affectedCount} URLs across the crawl.`,
      snippet: sample ? sample.evidence.snippet : undefined,
      action: group.stackFix || (sample ? sample.evidence.expected : 'Review and correct on affected templates.'),
    });
  }

  // Fallback needle movers if clean
  if (topNeedleMovers.length === 0) {
    topNeedleMovers.push({
      priority: 'Quick Win',
      title: 'Maintain Current Search Best Practices',
      description: 'Zero critical or high severity SEO errors were identified during crawl.',
      action: 'Continue monitoring sitemap freshness and mobile performance vitals.',
    });
  }

  return {
    schemaVersion: '2.0.0',
    auditVersion: '1.2.0',
    targetUrl: normalizedUrl,
    auditTimestamp: new Date().toISOString(),
    coverage: {
      totalChecks: totalCheckFamilies,
      evaluatedChecks,
      unknownChecks: unknownChecksCount,
      coveragePercentage,
    },
    summary: llmResult.summary,
    scores: {
      overall: overallScore,
      technical: technicalScore,
      content: contentScore,
      performance: performance.score,
      mobile: mobileScore,
      social: 90,
      aeo: aeoScore,
      geo: geoScore,
    },
    aeoSignals,
    geoSignals,
    mobileMetrics,
    archetype,
    topNeedleMovers,
    prioritizedGroups: groups,
    prioritiesFromLlm: llmResult.priorities,
    whatPassed,
    notChecked,
    allFindings: findings,
    pagesChecked: pages.length,
    detectedStack: metadata.detectedStack,
    technical,
    semantics,
    performance,
    codePatches,
    onchainReceipt,
    checkEngineReport: {
      summary: llmResult.summary,
      meta: {
        targetUrl: normalizedUrl,
        auditTimestamp: new Date().toISOString(),
        mode,
        pagesChecked: pages.length,
        detectedStack: metadata.detectedStack,
        durationMs: 0,
      },
      prioritizedGroups: groups,
      prioritiesFromLlm: llmResult.priorities,
      whatPassed,
      notChecked,
      allFindings: findings,
    },
  };
}
