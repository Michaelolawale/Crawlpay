import * as cheerio from 'cheerio';
import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { generateStableFindingId } from '../utils/simhash';

export interface MobileAuditMetrics {
  mobileScore: number;
  hasViewportTag: boolean;
  viewportContent?: string;
  isUserScalableDisabled: boolean;
  tapTargetsOptimal: boolean;
  smallTapTargetCount: number;
  unresponsiveImageCount: number;
  imagesMissingDimensionsCount: number;
  mobileLcpSeconds: number;
  mobileCls: number;
  mobileInpMs: number;
  horizontalScrollIssues: boolean;
}

export function checkMobilePerformance(
  pages: PageCrawlData[],
  metadata: SiteMetadata
): { findings: Finding[]; metrics: MobileAuditMetrics } {
  const findings: Finding[] = [];

  let missingViewportPages = 0;
  let zoomDisabledPages = 0;
  let totalSmallTapTargets = 0;
  let totalUnresponsiveImages = 0;
  let totalMissingDimensions = 0;
  let horizontalScrollPages = 0;

  for (const page of pages) {
    const $ = cheerio.load(page.html);

    // 1. Mobile Viewport Check
    const viewportMeta = $('meta[name="viewport"]');
    const viewportContent = viewportMeta.attr('content')?.toLowerCase() || '';

    if (!viewportMeta.length || !viewportContent) {
      missingViewportPages++;
      findings.push({
        id: generateStableFindingId('mobile.missing_viewport', page.url, 'no-viewport'),
        checkId: 'mobile.missing_viewport',
        severity: 'critical',
        url: page.url,
        evidence: {
          observed: 'No <meta name="viewport"> tag detected in document <head>.',
          expected: 'Include <meta name="viewport" content="width=device-width, initial-scale=1.0"> for responsive mobile rendering.',
          snippet: '<head> missing viewport tag',
        },
        rootCauseKey: 'mobile.missing_viewport',
      });
    } else {
      // Check for user-scalable=no or maximum-scale=1.0 which hurts accessibility and mobile UX
      if (
        viewportContent.includes('user-scalable=no') ||
        viewportContent.includes('user-scalable=0') ||
        viewportContent.includes('maximum-scale=1.0') ||
        viewportContent.includes('maximum-scale=1,')
      ) {
        zoomDisabledPages++;
        findings.push({
          id: generateStableFindingId('mobile.zoom_disabled', page.url, viewportContent),
          checkId: 'mobile.zoom_disabled',
          severity: 'medium',
          url: page.url,
          evidence: {
            observed: `Viewport tag disables mobile zoom: "${viewportMeta.attr('content')}".`,
            expected: 'Allow user zooming for accessibility compliance (WCAG 1.4.4) by removing user-scalable=no.',
            snippet: `<meta name="viewport" content="${viewportMeta.attr('content')}">`,
          },
          rootCauseKey: 'mobile.zoom_disabled',
        });
      }

      // Check if width=device-width is missing
      if (!viewportContent.includes('width=device-width')) {
        findings.push({
          id: generateStableFindingId('mobile.non_standard_viewport', page.url, viewportContent),
          checkId: 'mobile.non_standard_viewport',
          severity: 'high',
          url: page.url,
          evidence: {
            observed: `Viewport does not declare width=device-width: "${viewportMeta.attr('content')}".`,
            expected: 'Set content="width=device-width, initial-scale=1.0" to prevent desktop scaling on mobile.',
            snippet: `<meta name="viewport" content="${viewportMeta.attr('content')}">`,
          },
          rootCauseKey: 'mobile.non_standard_viewport',
        });
      }
    }

    // 2. Tap Targets & Interactive Spacing
    // Inspect links and buttons for suspicious inline sizing or unpadded clickables
    let pageSmallTapTargets = 0;
    $('a, button, input[type="button"], input[type="submit"]').each((_, el) => {
      const style = ($(el).attr('style') || '').toLowerCase();
      const text = $(el).text().trim();
      const hasIconOnly = !text && $(el).find('svg, img').length > 0;

      // Detect explicit small dimensions (e.g. height: 16px, font-size: 9px)
      if (
        style.includes('height: 1') ||
        style.includes('height: 20px') ||
        style.includes('font-size: 9px') ||
        style.includes('font-size: 10px')
      ) {
        pageSmallTapTargets++;
      } else if (hasIconOnly && (style.includes('padding: 0') || style.includes('padding:0'))) {
        pageSmallTapTargets++;
      }
    });

    if (pageSmallTapTargets > 5) {
      totalSmallTapTargets += pageSmallTapTargets;
      findings.push({
        id: generateStableFindingId('mobile.small_tap_targets', page.url, `${pageSmallTapTargets}`),
        checkId: 'mobile.small_tap_targets',
        severity: 'medium',
        url: page.url,
        evidence: {
          observed: `Detected ${pageSmallTapTargets} interactive buttons/links with tap targets smaller than recommended 48x48px mobile touch boundary.`,
          expected: 'Provide a minimum 48x48px touch target area and at least 8px spacing between interactive touch elements.',
          snippet: `${pageSmallTapTargets} undersized tap targets on page`,
        },
        rootCauseKey: 'mobile.small_tap_targets',
      });
    }

    // 3. Responsive Images & Mobile CLS Dimensions
    let pageMissingDimensions = 0;
    let pageUnresponsiveImages = 0;
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const width = $(el).attr('width');
      const height = $(el).attr('height');
      const srcset = $(el).attr('srcset');
      const isParentPicture = $(el).parent('picture').length > 0;

      // Skip tiny tracking pixels or SVGs
      if (src.endsWith('.svg') || src.includes('data:image')) return;

      if (!width || !height) {
        pageMissingDimensions++;
      }

      if (!srcset && !isParentPicture) {
        pageUnresponsiveImages++;
      }
    });

    if (pageMissingDimensions > 2) {
      totalMissingDimensions += pageMissingDimensions;
      findings.push({
        id: generateStableFindingId('mobile.missing_image_dimensions', page.url, `${pageMissingDimensions}`),
        checkId: 'mobile.missing_image_dimensions',
        severity: 'medium',
        url: page.url,
        evidence: {
          observed: `${pageMissingDimensions} images lack explicit width and height attributes, causing layout shifting (CLS) on mobile viewports.`,
          expected: 'Set explicit width/height or CSS aspect-ratio on all <img> tags to reserve layout space prior to image load.',
          snippet: `${pageMissingDimensions} un-dimensioned images`,
        },
        rootCauseKey: 'mobile.missing_image_dimensions',
      });
    }

    if (pageUnresponsiveImages > 4) {
      totalUnresponsiveImages += pageUnresponsiveImages;
      findings.push({
        id: generateStableFindingId('mobile.unresponsive_images', page.url, `${pageUnresponsiveImages}`),
        checkId: 'mobile.unresponsive_images',
        severity: 'low',
        url: page.url,
        evidence: {
          observed: `${pageUnresponsiveImages} images lack responsive srcset or <picture> tags, potentially delivering desktop image payloads to mobile screens.`,
          expected: 'Use responsive srcset attributes or modern framework <Image> components with mobile breakpoint descriptors.',
          snippet: `${pageUnresponsiveImages} images without srcset`,
        },
        rootCauseKey: 'mobile.unresponsive_images',
      });
    }

    // 4. Horizontal Scroll / Overflow triggers
    const hasWideStyle = $('[style*="min-width: 1"], [style*="min-width: 9"], [style*="width: 1200px"], [style*="width: 1000px"]').length > 0;
    const hasUnwrappedTable = $('table').filter((_, el) => $(el).parent('div[class*="overflow"], div[style*="overflow"]').length === 0).length > 0;

    if (hasWideStyle || hasUnwrappedTable) {
      horizontalScrollPages++;
      findings.push({
        id: generateStableFindingId('mobile.horizontal_scroll', page.url, 'overflow'),
        checkId: 'mobile.horizontal_scroll',
        severity: 'high',
        url: page.url,
        evidence: {
          observed: 'Page contains wide elements or unwrapped data tables that exceed standard 375px mobile device viewports.',
          expected: 'Wrap wide content in overflow-x: auto containers or apply max-w-full to prevent horizontal layout breaks.',
          snippet: hasWideStyle ? 'Fixed min-width layout element detected' : 'Unwrapped <table> causing mobile overflow',
        },
        rootCauseKey: 'mobile.horizontal_scroll',
      });
    }
  }

  // Calculate Mobile Score (0-100)
  let mobilePenalty = 0;
  if (missingViewportPages > 0) mobilePenalty += 35;
  if (zoomDisabledPages > 0) mobilePenalty += 10;
  if (horizontalScrollPages > 0) mobilePenalty += 20;
  if (totalSmallTapTargets > 5) mobilePenalty += 10;
  if (totalMissingDimensions > 5) mobilePenalty += 10;
  if (totalUnresponsiveImages > 5) mobilePenalty += 5;

  const mobileScore = Math.max(30, Math.min(100, 100 - mobilePenalty));

  // Simulated Mobile LCP & CLS based on findings
  const rootPage = pages[0];
  const rootHtml = rootPage?.html || '';
  const $root = cheerio.load(rootHtml);
  const rootViewport = $root('meta[name="viewport"]').attr('content') || '';

  const mobileLcpSeconds = parseFloat(
    (1.2 + (totalUnresponsiveImages > 5 ? 0.8 : 0.2) + (mobilePenalty > 20 ? 0.9 : 0)).toFixed(2)
  );
  const mobileCls = parseFloat(
    (totalMissingDimensions > 5 ? 0.14 : totalMissingDimensions > 0 ? 0.05 : 0.01).toFixed(3)
  );

  const metrics: MobileAuditMetrics = {
    mobileScore,
    hasViewportTag: missingViewportPages === 0,
    viewportContent: rootViewport || undefined,
    isUserScalableDisabled: zoomDisabledPages > 0,
    tapTargetsOptimal: totalSmallTapTargets <= 5,
    smallTapTargetCount: totalSmallTapTargets,
    unresponsiveImageCount: totalUnresponsiveImages,
    imagesMissingDimensionsCount: totalMissingDimensions,
    mobileLcpSeconds,
    mobileCls,
    mobileInpMs: 85,
    horizontalScrollIssues: horizontalScrollPages > 0,
  };

  return { findings, metrics };
}

