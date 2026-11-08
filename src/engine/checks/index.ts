import { Finding, PageCrawlData, SiteMetadata } from '../types';
import { RobotsParser } from '../utils/robotsParser';
import { checkIndexability } from './indexability';
import { checkCanonicals } from './canonical';
import { checkTitlesAndDescriptions } from './titlesDescriptions';
import { checkHeadings } from './headings';
import { checkLinks } from './links';
import { checkSitemap } from './sitemap';
import { checkDuplicateContent } from './duplicateContent';
import { checkImages } from './images';
import { checkPerformance } from './performance';
import { checkStructuredData } from './structuredData';
import { checkMobilePerformance, MobileAuditMetrics } from './mobilePerformance';
import { checkAEO, AeoAnalysisSignals } from './aeo';
import { checkGEO, GeoAnalysisSignals } from './geo';
import { checkAnalyticsTracking, AnalyticsSignals } from './analyticsTracking';
import { checkLocalSeo, LocalSeoSignals } from './localSeo';

export interface CheckSuiteResult {
  findings: Finding[];
  notChecked: string[];
  mobileMetrics?: MobileAuditMetrics;
  aeoSignals?: AeoAnalysisSignals;
  geoSignals?: GeoAnalysisSignals;
  analyticsSignals?: AnalyticsSignals;
  localSeoSignals?: LocalSeoSignals;
}

/**
 * Runs the deterministic checks in strict order:
 * 1. indexability
 * 2. canonical
 * 3. titles_and_descriptions
 * 4. headings
 * 5. links
 * 6. sitemap
 * 7. duplicate_content
 * 8. images
 * 9. performance
 * 10. structured_data
 * 11. mobile_performance
 * 12. analytics_and_conversion
 * 13. local_seo_readiness
 */
export async function runAllChecks(
  pages: PageCrawlData[],
  metadata: SiteMetadata,
  robotsParser: RobotsParser
): Promise<CheckSuiteResult> {
  const allFindings: Finding[] = [];
  const notChecked: string[] = [
    'Off-page backlink profile & domain rating (requires third-party web crawler)',
    'Historic keyword rank tracking (requires Google Search Console account connection)',
  ];

  // 1. Indexability
  const indexabilityFindings = checkIndexability(pages, metadata, robotsParser);
  allFindings.push(...indexabilityFindings);

  // 2. Canonical
  const canonicalFindings = checkCanonicals(pages, metadata);
  allFindings.push(...canonicalFindings);

  // 3. Titles and Descriptions
  const titleDescFindings = checkTitlesAndDescriptions(pages);
  allFindings.push(...titleDescFindings);

  // 4. Headings
  const headingFindings = checkHeadings(pages);
  allFindings.push(...headingFindings);

  // 5. Links
  const linkFindings = checkLinks(pages, metadata);
  allFindings.push(...linkFindings);

  // 6. Sitemap
  const sitemapFindings = checkSitemap(pages, metadata);
  allFindings.push(...sitemapFindings);

  // 7. Duplicate Content
  const duplicateFindings = await checkDuplicateContent(pages, metadata);
  allFindings.push(...duplicateFindings);

  // 8. Images
  const imageFindings = checkImages(pages);
  allFindings.push(...imageFindings);

  // 9. Performance
  const { findings: perfFindings, notCheckedReason: perfNotChecked } = await checkPerformance(pages, metadata);
  allFindings.push(...perfFindings);
  if (perfNotChecked) {
    notChecked.push(perfNotChecked);
  }

  // 10. Structured Data
  const structuredDataFindings = checkStructuredData(pages);
  allFindings.push(...structuredDataFindings);

  // 11. Mobile SEO & Responsiveness
  const { findings: mobileFindings, metrics: mobileMetrics } = checkMobilePerformance(pages, metadata);
  allFindings.push(...mobileFindings);

  // 12. AEO (Answer Engine Optimization)
  const { findings: aeoFindings, signals: aeoSignals } = checkAEO(pages, metadata);
  allFindings.push(...aeoFindings);

  // 13. GEO (Generative Engine Optimization)
  const { findings: geoFindings, signals: geoSignals } = checkGEO(
    pages,
    metadata,
    robotsParser,
    metadata.wafProbe,
    metadata.llmsTxtFound
  );
  allFindings.push(...geoFindings);

  // 14. Analytics & Conversion Tracking Check (Without third-party access)
  const { findings: analyticsFindings, signals: analyticsSignals } = checkAnalyticsTracking(pages, metadata);
  allFindings.push(...analyticsFindings);

  // 15. Local SEO & Google Business Profile Readiness Check (Without third-party access)
  const { findings: localFindings, signals: localSeoSignals } = checkLocalSeo(pages, metadata);
  allFindings.push(...localFindings);

  return {
    findings: allFindings,
    notChecked,
    mobileMetrics,
    aeoSignals,
    geoSignals,
    analyticsSignals,
    localSeoSignals,
  };
}
