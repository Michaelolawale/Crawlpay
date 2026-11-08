import * as cheerio from 'cheerio';
import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { generateStableFindingId } from '../utils/simhash';

export interface LocalSeoSignals {
  hasLocalBusinessSchema: boolean;
  hasAddressSignal: boolean;
  hasPhoneSignal: boolean;
  hasGoogleMapsLink: boolean;
  businessName?: string;
}

export function checkLocalSeo(
  pages: PageCrawlData[],
  _metadata: SiteMetadata
): { findings: Finding[]; signals: LocalSeoSignals } {
  const findings: Finding[] = [];

  const rootPage = pages[0];
  if (!rootPage || !rootPage.html) {
    return {
      findings,
      signals: {
        hasLocalBusinessSchema: false,
        hasAddressSignal: false,
        hasPhoneSignal: false,
        hasGoogleMapsLink: false,
      },
    };
  }

  const html = rootPage.html;
  const $ = cheerio.load(html);

  let hasLocalBusinessSchema = false;
  let hasAddressSignal = false;
  let businessName: string | undefined;

  // 1. Inspect JSON-LD for LocalBusiness & Address
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text().trim());
      const items = Array.isArray(parsed) ? parsed : parsed?.['@graph'] || [parsed];
      for (const item of items) {
        const type = String(item?.['@type'] || '').toLowerCase();
        if (
          type.includes('localbusiness') ||
          type.includes('store') ||
          type.includes('restaurant') ||
          type.includes('professionalservice') ||
          type.includes('medicalbusiness')
        ) {
          hasLocalBusinessSchema = true;
          if (item?.name) businessName = String(item.name);
          if (item?.address) hasAddressSignal = true;
        }
      }
    } catch {}
  });

  // 2. Inspect on-page text and links for Map & Phone signals
  const hasPhoneSignal = $('a[href^="tel:"]').length > 0 || /\b(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/.test($('body').text());
  const hasGoogleMapsLink = $('iframe[src*="google.com/maps"]').length > 0 || $('a[href*="maps.google.com"], a[href*="goo.gl/maps"], a[href*="google.com/maps"]').length > 0;
  if ($('[class*="address"], [id*="address"], address').length > 0) {
    hasAddressSignal = true;
  }

  const signals: LocalSeoSignals = {
    hasLocalBusinessSchema,
    hasAddressSignal,
    hasPhoneSignal,
    hasGoogleMapsLink,
    businessName,
  };

  // If page claims or appears to be a local business, verify NAP consistency
  const isLikelyLocal = html.toLowerCase().includes('our location') ||
    html.toLowerCase().includes('visit our store') ||
    html.toLowerCase().includes('service area') ||
    hasGoogleMapsLink;

  if (isLikelyLocal && !hasLocalBusinessSchema) {
    findings.push({
      id: generateStableFindingId('local_seo.missing_schema', rootPage.url, 'no_schema'),
      checkId: 'local_seo.missing_schema',
      severity: 'medium',
      url: rootPage.url,
      evidence: {
        observed: 'Physical location or map signals found, but no Schema.org LocalBusiness structured data is declared.',
        expected: 'Add Schema.org LocalBusiness JSON-LD markup with your business name, address, telephone, and opening hours for Google Map Pack rankings.',
        snippet: '<!-- Missing Schema.org LocalBusiness JSON-LD -->',
      },
      rootCauseKey: 'local_seo.missing_schema',
    });
  }

  return { findings, signals };
}
