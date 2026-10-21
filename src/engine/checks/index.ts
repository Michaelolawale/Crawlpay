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

export interface CheckSuiteResult {
  findings: Finding[];
  notChecked: string[];
}

/**
 * Runs the 10 checks in strict deterministic order per spec:
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
 */
export async function runAllChecks(
  pages: PageCrawlData[],
  metadata: SiteMetadata,
  robotsParser: RobotsParser
): Promise<CheckSuiteResult> {
  const allFindings: Finding[] = [];
  const notChecked: string[] = [
    'Backlinks profile & external domain authority',
    'Keyword search rankings & search impressions',
    'Google Search Console API crawl stats',
    'Google Analytics 4 & conversion tracking setup',
    'Google Business Profile / Map pack verification',
    'Protected pages behind authentication / paywalls',
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

  return {
    findings: allFindings,
    notChecked,
  };
}
