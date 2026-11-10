import { runAuditPipeline } from '../services/auditRunner';
import { FullAuditReport } from '../types/audit';

export type IntegratedAuditReport = FullAuditReport & {
  meta?: {
    targetUrl: string;
    auditTimestamp: string;
    mode: 'quick' | 'full';
    pagesChecked: number;
    detectedStack: {
      cms?: string;
      seoPlugin?: string;
      framework?: string;
    };
    durationMs: number;
  };
};

/**
 * Programmatic agent entry point for executing autonomous CrawlPay audits.
 * Invokes the comprehensive deterministic audit engine with multi-page BFS crawling,
 * technical SEO, AEO/GEO signals, keyword alignment, analytics & local SEO validation,
 * and Celo Mainnet x402 on-chain receipt generation.
 */
export async function executeCheckEngineAudit(
  targetUrl: string,
  mode: 'quick' | 'full' = 'quick'
): Promise<IntegratedAuditReport> {
  const startTime = Date.now();
  const report = await runAuditPipeline(targetUrl, mode, true);
  const durationMs = Date.now() - startTime;

  return {
    ...report,
    meta: {
      targetUrl: report.targetUrl,
      auditTimestamp: report.auditTimestamp,
      mode,
      pagesChecked: report.pagesChecked,
      detectedStack: report.detectedStack,
      durationMs,
    },
  };
}

