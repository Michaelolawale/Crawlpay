import * as cheerio from 'cheerio';
import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { generateStableFindingId } from '../utils/simhash';

export interface AnalyticsSignals {
  hasGa4: boolean;
  hasGtm: boolean;
  hasMetaPixel: boolean;
  hasLeadForm: boolean;
  hasPhoneLink: boolean;
  hasEmailLink: boolean;
  detectedTrackingId?: string;
}

export function checkAnalyticsTracking(
  pages: PageCrawlData[],
  _metadata: SiteMetadata
): { findings: Finding[]; signals: AnalyticsSignals } {
  const findings: Finding[] = [];

  const rootPage = pages[0];
  if (!rootPage || !rootPage.html) {
    return {
      findings,
      signals: {
        hasGa4: false,
        hasGtm: false,
        hasMetaPixel: false,
        hasLeadForm: false,
        hasPhoneLink: false,
        hasEmailLink: false,
      },
    };
  }

  const html = rootPage.html;
  const $ = cheerio.load(html);

  // 1. GA4 & GTM Detection
  const ga4Match = html.match(/G-[A-Za-z0-9]{4,15}/);
  const gtmMatch = html.match(/GTM-[A-Za-z0-9]{4,10}/);
  const hasGa4 = Boolean(ga4Match) || html.includes('googletagmanager.com/gtag/js') || html.includes('google-analytics.com');
  const hasGtm = Boolean(gtmMatch) || html.includes('googletagmanager.com/gtm.js');
  const hasMetaPixel = html.includes('fbq(') || html.includes('connect.facebook.net');

  // 2. Lead Capture & Conversion Signals
  const hasLeadForm = $('form').length > 0 && ($('form input[type="email"], form input[type="text"], form button[type="submit"], form input[type="submit"]').length > 0);
  const hasPhoneLink = $('a[href^="tel:"]').length > 0;
  const hasEmailLink = $('a[href^="mailto:"]').length > 0;

  const signals: AnalyticsSignals = {
    hasGa4,
    hasGtm,
    hasMetaPixel,
    hasLeadForm,
    hasPhoneLink,
    hasEmailLink,
    detectedTrackingId: ga4Match ? ga4Match[0] : gtmMatch ? gtmMatch[0] : undefined,
  };

  // Flag missing web analytics
  if (!hasGa4 && !hasGtm) {
    findings.push({
      id: generateStableFindingId('analytics.missing_ga4', rootPage.url, 'no_ga4'),
      checkId: 'analytics.missing_ga4',
      severity: 'medium',
      url: rootPage.url,
      evidence: {
        observed: 'No Google Analytics 4 (GA4) or Google Tag Manager script was detected in your page code.',
        expected: 'Install Google Analytics 4 or Google Tag Manager in your <head> to track search visitors, referral traffic, and keyword conversions.',
        snippet: '<!-- Missing Google Analytics 4 (gtag.js) script -->',
      },
      rootCauseKey: 'analytics.missing_ga4',
    });
  }

  // Flag absence of conversion actions for commercial sites
  if (!hasLeadForm && !hasPhoneLink && !hasEmailLink) {
    findings.push({
      id: generateStableFindingId('analytics.no_conversion_action', rootPage.url, 'no_conversion'),
      checkId: 'analytics.no_conversion_action',
      severity: 'low',
      url: rootPage.url,
      evidence: {
        observed: 'The page lacks direct conversion elements (no lead forms, click-to-call phone links, or email contact links).',
        expected: 'Provide at least one clear conversion mechanism (e.g. newsletter form, demo booking, or contact link) to capture incoming organic search traffic.',
        snippet: 'Missing <form> or <a href="tel:..."> or <a href="mailto:...">',
      },
      rootCauseKey: 'analytics.no_conversion_action',
    });
  }

  return { findings, signals };
}
