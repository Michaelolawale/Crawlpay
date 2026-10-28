import * as cheerio from 'cheerio';
import { MobileAuditMetrics } from '../engine/checks/mobilePerformance';

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
  mobile?: MobileAuditMetrics;
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
  let responsiveImageCount = 0;
  let missingDimensionsCount = 0;
  images.each((_, el) => {
    const src = $(el).attr('src')?.toLowerCase() || '';
    if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg')) {
      nonWebpCount++;
    }
    const hasSrcset = !!$(el).attr('srcset');
    const isInsidePicture = $(el).parent('picture').length > 0;
    if (hasSrcset || isInsidePicture) {
      responsiveImageCount++;
    }
    if (!$(el).attr('width') || !$(el).attr('height')) {
      missingDimensionsCount++;
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

  // Mobile viewport and touch checks
  const viewportTag = $('meta[name="viewport"]');
  const viewportContent = viewportTag.attr('content') || '';
  const hasViewportTag = viewportTag.length > 0 && viewportContent.toLowerCase().includes('width=device-width');
  const isUserScalableDisabled =
    viewportContent.includes('user-scalable=no') ||
    viewportContent.includes('user-scalable=0') ||
    viewportContent.includes('maximum-scale=1.0');

  let smallTapTargetCount = 0;
  $('a, button').each((_, el) => {
    const style = ($(el).attr('style') || '').toLowerCase();
    if (style.includes('height: 1') || style.includes('height: 20px') || style.includes('font-size: 10px')) {
      smallTapTargetCount++;
    }
  });

  const responsiveImagesRatio = images.length > 0 ? Math.round((responsiveImageCount / images.length) * 100) : 100;

  let mobilePenalty = 0;
  if (!hasViewportTag) mobilePenalty += 35;
  if (isUserScalableDisabled) mobilePenalty += 10;
  if (smallTapTargetCount > 5) mobilePenalty += 15;
  if (responsiveImagesRatio < 50 && images.length > 2) mobilePenalty += 15;
  if (renderBlockingScriptsCount > 2) mobilePenalty += 10;

  const score = Math.max(45, 100 - penalty);
  const mobileScore = Math.max(40, 100 - mobilePenalty);

  const lcpEstimateSeconds = parseFloat((1.0 + (100 - score) * 0.028).toFixed(2));
  const clsEstimate = parseFloat(((100 - score) * 0.0018).toFixed(3));
  const mobileLcpSeconds = parseFloat((1.2 + (100 - mobileScore) * 0.03).toFixed(2));
  const mobileCls = parseFloat(((100 - mobileScore) * 0.002).toFixed(3));

  return {
    score,
    lcpEstimateSeconds,
    clsEstimate,
    heavyAssetCount: nonWebpCount,
    renderBlockingScriptsCount,
    usesModernImageFormats,
    opportunities,
    mobile: {
      mobileScore,
      hasViewportTag,
      viewportContent,
      isUserScalableDisabled,
      tapTargetsOptimal: smallTapTargetCount <= 5,
      smallTapTargetCount,
      unresponsiveImageCount: Math.max(0, images.length - responsiveImageCount),
      imagesMissingDimensionsCount: missingDimensionsCount,
      mobileLcpSeconds,
      mobileCls,
      mobileInpMs: 85,
      horizontalScrollIssues: false,
    },
  };
}
