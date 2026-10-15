import * as cheerio from 'cheerio';

export interface PerformanceVitals {
  score: number;
  lcpEstimateSeconds: number;
  clsEstimate: number;
  heavyAssetCount: number;
  renderBlockingScriptsCount: number;
  usesModernImageFormats: boolean;
  opportunities: Array<{
    title: string;
    impact: 'High' | 'Medium' | 'Low';
    savingEstimate: string;
  }>;
}

export function auditSpeedVitals($: cheerio.CheerioAPI, htmlLength: number): PerformanceVitals {
  const scripts = $('script[src]');
  let renderBlockingScriptsCount = 0;
  scripts.each((_, el) => {
    const asyncAttr = $(el).attr('async');
    const deferAttr = $(el).attr('defer');
    const typeAttr = $(el).attr('type');
    if (asyncAttr === undefined && deferAttr === undefined && typeAttr !== 'module') {
      renderBlockingScriptsCount++;
    }
  });

  const images = $('img');
  let nonWebpCount = 0;
  images.each((_, el) => {
    const src = $(el).attr('src')?.toLowerCase() || '';
    if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg')) {
      nonWebpCount++;
    }
  });

  const usesModernImageFormats = images.length === 0 || nonWebpCount === 0;
  const opportunities: Array<{ title: string; impact: 'High' | 'Medium' | 'Low'; savingEstimate: string }> = [];

  let penalty = 0;
  if (renderBlockingScriptsCount > 2) {
    penalty += Math.min(25, renderBlockingScriptsCount * 5);
    opportunities.push({
      title: `Defer ${renderBlockingScriptsCount} render-blocking scripts`,
      impact: 'High',
      savingEstimate: `~${(renderBlockingScriptsCount * 0.25).toFixed(1)}s faster LCP`,
    });
  }

  if (nonWebpCount > 0) {
    penalty += Math.min(20, nonWebpCount * 4);
    opportunities.push({
      title: `Convert ${nonWebpCount} legacy PNG/JPEG images to modern WebP/AVIF`,
      impact: 'High',
      savingEstimate: '~65% reduction in asset payload',
    });
  }

  if (htmlLength > 250000) {
    penalty += 15;
    opportunities.push({
      title: 'Reduce bloated HTML DOM size (>250KB transfer)',
      impact: 'Medium',
      savingEstimate: '~150ms parsing time',
    });
  }

  const score = Math.max(45, 100 - penalty);
  const lcpEstimateSeconds = parseFloat((1.0 + (100 - score) * 0.028).toFixed(2));
  const clsEstimate = parseFloat(((100 - score) * 0.0018).toFixed(3));

  return {
    score,
    lcpEstimateSeconds,
    clsEstimate,
    heavyAssetCount: nonWebpCount,
    renderBlockingScriptsCount,
    usesModernImageFormats,
    opportunities,
  };
}
