import { PageCrawler } from '../crawler/pageCrawler';
import { runAllChecks } from './checks';
import { groupAndPrioritizeFindings } from './aggregator';
import { summarizeAuditWithLlm } from './llmLayer';
import { SeoAuditReport, FindingGroup, Finding, PriorityItem, SiteMetadata } from './types';
import { buyCoordinator, CrawlExecutionLog } from '../services/buyClient';

export interface IntegratedAuditReport extends SeoAuditReport {
  onchainReceipt: CrawlExecutionLog;
}

export async function executeCheckEngineAudit(
  targetUrl: string,
  mode: 'quick' | 'full' = 'quick'
): Promise<IntegratedAuditReport> {
  const startTime = Date.now();

  // 1. Run BFS Crawler with hard caps per spec
  const crawler = new PageCrawler({
    mode,
    maxPages: mode === 'full' ? 50 : 1,
    maxDepth: 3,
    maxResponseBytes: 2 * 1024 * 1024,
    totalTimeoutMs: 60000,
    requestsPerSecond: 2,
    userAgent: 'CrawlPayBot/1.0 (+https://crawlpay.org/bot)',
  });

  const crawlResult = await crawler.crawl(targetUrl);
  const { pages, metadata, robotsParser } = crawlResult;

  // 2. Run the 10 checks deterministically
  const { findings, notChecked } = await runAllChecks(pages, metadata, robotsParser);

  // 3. Group by root cause, compute page importance & priorities, attach stackFix
  const { groups, whatPassed } = groupAndPrioritizeFindings(findings, pages, metadata);

  // 4. Summarize and prioritize via Zod-guarded LLM layer (strictly FindingGroup[] input)
  const llmResult = await summarizeAuditWithLlm(groups, metadata);

  // 5. Connect Celo x402 payment & onchain receipt
  let domain = metadata.hostname;
  const browserReceipt = await buyCoordinator.rentBrowserSession(metadata.baseUrl);
  const socialReceipt = await buyCoordinator.querySocialSignals(domain);
  const onchainReceipt = buyCoordinator.buildExecutionLog(metadata.baseUrl, browserReceipt, socialReceipt);

  const durationMs = Date.now() - startTime;

  return {
    summary: llmResult.summary,
    meta: {
      targetUrl: metadata.baseUrl,
      auditTimestamp: new Date().toISOString(),
      mode,
      pagesChecked: pages.length,
      detectedStack: metadata.detectedStack,
      durationMs,
    },
    prioritizedGroups: groups,
    prioritiesFromLlm: llmResult.priorities,
    whatPassed,
    notChecked,
    allFindings: findings,
    onchainReceipt,
  };
}
