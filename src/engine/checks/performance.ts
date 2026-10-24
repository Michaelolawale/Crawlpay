import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { generateStableFindingId } from '../utils/simhash';

export async function checkPerformance(
  pages: PageCrawlData[],
  metadata: SiteMetadata
): Promise<{ findings: Finding[]; notCheckedReason?: string }> {
  const findings: Finding[] = [];
  let notCheckedReason: string | undefined;

  // 1. Report page weight from our own crawl
  for (const page of pages) {
    if (page.byteSize > 1.5 * 1024 * 1024) {
      const mbSize = (page.byteSize / (1024 * 1024)).toFixed(2);
      findings.push({
        id: generateStableFindingId('performance.heavy_page_weight', page.url, `${page.byteSize}`),
        checkId: 'performance.heavy_page_weight',
        severity: 'medium',
        url: page.url,
        evidence: {
          observed: `Total HTML document payload is ${mbSize} MB, exceeding the recommended 1.5 MB uncompressed threshold.`,
          expected: 'Keep static HTML and inline styles/scripts under 500 KB to reduce initial parse and Time To First Byte (TTFB).',
          snippet: `Page weight: ${mbSize} MB`,
        },
        rootCauseKey: 'performance.heavy_page_weight',
      });
    }
  }

  // 2. Query Google PageSpeed Insights API (mobile) for homepage
  const homepageUrl = metadata.baseUrl;
  const apiKey = process.env.PAGESPEED_INSIGHTS_API_KEY;
  let psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    homepageUrl
  )}&strategy=mobile`;
  if (apiKey) {
    psiUrl += `&key=${apiKey}`;
  }

  try {
    const res = await fetch(psiUrl, { signal: AbortSignal.timeout(9000) });
    if (!res.ok) {
      notCheckedReason = res.status === 429
        ? 'Google PSI live API rate-limited (CrawlPay deterministic speed engine used)'
        : `Google PageSpeed Insights check skipped (HTTP ${res.status})`;
      return { findings, notCheckedReason };
    }

    const data = await res.json();
    const loadingExperience = data.loadingExperience;
    const lighthouseMetrics = data.lighthouseResult?.audits;

    // Check CrUX field data first, fallback to Lighthouse lab data
    let lcp: number | undefined;
    let cls: number | undefined;
    let inp: number | undefined;
    let isFieldData = false;

    if (loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS) {
      lcp = loadingExperience.metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile / 1000;
      isFieldData = true;
    } else if (lighthouseMetrics?.['largest-contentful-paint']?.numericValue) {
      lcp = lighthouseMetrics['largest-contentful-paint'].numericValue / 1000;
    }

    if (loadingExperience?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE) {
      cls = loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100;
      isFieldData = true;
    } else if (lighthouseMetrics?.['cumulative-layout-shift']?.numericValue !== undefined) {
      cls = lighthouseMetrics['cumulative-layout-shift'].numericValue;
    }

    if (loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT) {
      inp = loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT.percentile;
    }

    const sourceLabel = isFieldData ? 'Field data (CrUX)' : 'Lab data (Lighthouse Mobile)';

    // Thresholds: LCP <= 2.5s
    if (lcp !== undefined && lcp > 2.5) {
      findings.push({
        id: generateStableFindingId('performance.lcp_slow', homepageUrl, `${lcp}`),
        checkId: 'performance.lcp_slow',
        severity: lcp > 4.0 ? 'high' : 'medium',
        url: homepageUrl,
        evidence: {
          observed: `Largest Contentful Paint (LCP) is ${lcp.toFixed(2)}s [${sourceLabel}].`,
          expected: 'LCP must be <= 2.5s for a good Google Page Experience rating.',
          snippet: `LCP: ${lcp.toFixed(2)}s (${sourceLabel})`,
        },
        rootCauseKey: 'performance.lcp_slow',
      });
    }

    // Thresholds: CLS <= 0.1
    if (cls !== undefined && cls > 0.1) {
      findings.push({
        id: generateStableFindingId('performance.cls_high', homepageUrl, `${cls}`),
        checkId: 'performance.cls_high',
        severity: cls > 0.25 ? 'high' : 'medium',
        url: homepageUrl,
        evidence: {
          observed: `Cumulative Layout Shift (CLS) is ${cls.toFixed(3)} [${sourceLabel}].`,
          expected: 'CLS must be <= 0.1 to avoid unexpected layout shifts while page loads.',
          snippet: `CLS: ${cls.toFixed(3)} (${sourceLabel})`,
        },
        rootCauseKey: 'performance.cls_high',
      });
    }

    // Thresholds: INP <= 200ms
    if (inp !== undefined && inp > 200) {
      findings.push({
        id: generateStableFindingId('performance.inp_slow', homepageUrl, `${inp}`),
        checkId: 'performance.inp_slow',
        severity: 'medium',
        url: homepageUrl,
        evidence: {
          observed: `Interaction to Next Paint (INP) is ${inp}ms [${sourceLabel}].`,
          expected: 'INP should be <= 200ms for responsive interaction.',
          snippet: `INP: ${inp}ms (${sourceLabel})`,
        },
        rootCauseKey: 'performance.inp_slow',
      });
    }
  } catch (err: any) {
    notCheckedReason = `PageSpeed Insights API check skipped: ${err?.message || 'Connection timed out'}`;
  }

  return { findings, notCheckedReason };
}
