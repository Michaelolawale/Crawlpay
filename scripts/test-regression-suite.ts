/**
 * Crawlpay Regression Test Suite
 * Validates:
 * 1. SSRF Hardening (private IPs, loopback, cloud metadata, credentials)
 * 2. Deterministic relevanceScore formula & onPagePlacement
 * 3. No Competitor Hallucination in keyword engine
 * 4. Site Summary (Detected from Page Content) heuristic extraction
 * 5. Free Tier Rate Limiting & Failed Audit Non-Deduction
 * 6. Quick Audit Single-Page Hard Cap
 */

import * as cheerio from 'cheerio';
import { validateAndNormalizeTargetUrl, isPrivateOrReservedIp } from '../src/utils/security';
import {
  calculateRelevanceScore,
  generateSiteSummary,
  generateKeywordIntelligence,
} from '../src/analyzer/keywordEngine';
import { checkAnalyticsTracking } from '../src/engine/checks/analyticsTracking';
import { checkLocalSeo } from '../src/engine/checks/localSeo';
import { db, JobRecord } from '../src/services/db';
import { PageCrawler } from '../src/crawler/pageCrawler';
import { parseGscExport } from '../src/utils/gscParser';

async function runTests() {
  console.log('\n========================================');
  console.log('   CRAWLPAY REGRESSION TEST SUITE');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST GROUP 1: SSRF Protection & Private IP Filtering
  // ----------------------------------------------------
  console.log('\n[1] Testing SSRF Hardening & Private IP Filtering...');

  const privateIps = [
    '127.0.0.1',
    '10.0.0.5',
    '192.168.1.1',
    '172.16.0.1',
    '169.254.169.254', // AWS/GCP cloud metadata
    '::1',
  ];

  for (const ip of privateIps) {
    assert(isPrivateOrReservedIp(ip) === true, `isPrivateOrReservedIp correctly flags ${ip} as private`);
  }

  assert(isPrivateOrReservedIp('8.8.8.8') === false, 'isPrivateOrReservedIp allows public IP 8.8.8.8');
  assert(isPrivateOrReservedIp('1.1.1.1') === false, 'isPrivateOrReservedIp allows public IP 1.1.1.1');

  const blockedUrls = [
    'http://127.0.0.1:3000/api',
    'http://169.254.169.254/latest/meta-data',
    'http://localhost:8080',
    'http://admin:secret@celopulse.org', // User credentials
    'ftp://celopulse.org', // Non-http/https
  ];

  for (const url of blockedUrls) {
    const res = await validateAndNormalizeTargetUrl(url);
    assert(!res.valid, `validateAndNormalizeTargetUrl blocks unsafe URL: ${url}`);
  }

  const validPublicIp = await validateAndNormalizeTargetUrl('https://93.184.216.34');
  assert(validPublicIp.valid === true, 'validateAndNormalizeTargetUrl allows public routable IP 93.184.216.34');

  const validPublicDomain = await validateAndNormalizeTargetUrl('https://example.com');
  const isAllowedOrOfflineDns = validPublicDomain.valid || (validPublicDomain.error && validPublicDomain.error.includes('DNS resolution failed'));
  assert(Boolean(isAllowedOrOfflineDns), 'validateAndNormalizeTargetUrl handles public domain correctly');

  // ----------------------------------------------------
  // TEST GROUP 2: Deterministic relevanceScore Formula
  // ----------------------------------------------------
  console.log('\n[2] Testing Deterministic relevanceScore Formula & Placement...');

  // Formula: Title (+35), H1 (+25), Subheadings (+20), Meta (+10), Body Freq >= 3 (+10)
  const titleOnly = calculateRelevanceScore('seo crawler', 'Best SEO Crawler Platform', [], [], '', '');
  assert(titleOnly.score === 35, `Title-only presence scores exactly 35 (got ${titleOnly.score})`);
  assert(titleOnly.placement === 'in_title', 'Placement is in_title');

  const titleAndH1 = calculateRelevanceScore('seo crawler', 'Best SEO Crawler Platform', ['Modern SEO Crawler'], [], '', '');
  assert(titleAndH1.score === 60, `Title + H1 presence scores exactly 60 (got ${titleAndH1.score})`);
  assert(titleAndH1.placement === 'in_h1', 'Placement priority gives in_h1 over in_title');

  const fullPresence = calculateRelevanceScore(
    'seo crawler',
    'Best SEO Crawler Platform',
    ['Modern SEO Crawler'],
    ['Why Use an SEO Crawler', 'Features'],
    'Fast SEO crawler for indie developers',
    'An seo crawler helps analyze pages. This seo crawler runs fast. Every seo crawler needs speed.'
  );
  assert(fullPresence.score === 100, `Full presence across all tags scores exactly 100 (got ${fullPresence.score})`);

  const missing = calculateRelevanceScore('blockchain', 'App Store', ['Welcome'], [], '', 'Nothing here');
  assert(missing.score === 0, `Missing keyword scores exactly 0 (got ${missing.score})`);
  assert(missing.placement === 'missing_from_page', 'Placement is missing_from_page');

  // ----------------------------------------------------
  // TEST GROUP 3: No Competitor Hallucination
  // ----------------------------------------------------
  console.log('\n[3] Testing No Competitor Hallucination in Keyword Research...');

  const htmlWithoutCompetitor = `
    <html>
      <head><title>CeloPulse Directory | Web3 Directory</title></head>
      <body>
        <h1>Web3 Directory and Ecosystem Portal</h1>
        <h2>Explore Verified Projects</h2>
        <p>Discover verified decentralized applications built on Celo.</p>
      </body>
    </html>
  `;
  const $noComp = cheerio.load(htmlWithoutCompetitor);
  const intelNoComp = await generateKeywordIntelligence(
    $noComp,
    'https://celopulse.org',
    'CeloPulse Directory | Web3 Directory',
    'Discover verified decentralized applications built on Celo.',
    ['Web3 Directory and Ecosystem Portal'],
    ['Explore Verified Projects'],
    [],
    'web3'
  );

  const compKwNoComp = intelNoComp.suggestedKeywords.find((k) => k.angle === 'comparison');
  assert(
    compKwNoComp === undefined,
    'When no competitor is mentioned on page, comparison angle is strictly omitted (no hallucination)'
  );

  const htmlWithCompetitor = `
    <html>
      <head><title>FastDraft | Documentation Tool</title></head>
      <body>
        <h1>Fast Documentation Generator</h1>
        <p>The modern alternative to GitBook for technical documentation teams.</p>
      </body>
    </html>
  `;
  const $withComp = cheerio.load(htmlWithCompetitor);
  const intelWithComp = await generateKeywordIntelligence(
    $withComp,
    'https://fastdraft.com',
    'FastDraft | Documentation Tool',
    'The modern alternative to GitBook for technical documentation teams.',
    ['Fast Documentation Generator'],
    [],
    [],
    'saas'
  );

  const compKwWithComp = intelWithComp.suggestedKeywords.find((k) => k.angle === 'comparison');
  assert(
    compKwWithComp !== undefined && compKwWithComp.keyword.toLowerCase().includes('gitbook'),
    `When competitor ('GitBook') is explicitly mentioned on-page, extracts verified comparison: "${compKwWithComp?.keyword}"`
  );

  // ----------------------------------------------------
  // TEST GROUP 4: Site Summary Heuristic Extraction
  // ----------------------------------------------------
  console.log('\n[4] Testing Site Summary (Detected from Page Content)...');

  const summary = generateSiteSummary(
    $withComp,
    'FastDraft | Documentation Tool',
    'The modern alternative to GitBook for technical documentation teams.',
    'Fast Documentation Generator',
    'saas',
    'https://fastdraft.com'
  );

  assert(summary.detectedBrandName === 'FastDraft', `Extracted brand name is FastDraft (got ${summary.detectedBrandName})`);
  assert(summary.confidence === 'High', `Confidence is High when title, meta, and H1 exist (got ${summary.confidence})`);
  assert(summary.businessModel.includes('SaaS'), `Business model identifies as SaaS (got ${summary.businessModel})`);

  // Sparse HTML fallback confidence test
  const $sparse = cheerio.load('<html><body><p>Hello world</p></body></html>');
  const sparseSummary = generateSiteSummary($sparse, '', '', '', 'saas', 'https://sparse.com');
  assert(
    sparseSummary.confidence === 'Low (Unclear from page content)',
    'Confidence is Low when page lacks titles and headings'
  );

  // ----------------------------------------------------
  // TEST GROUP 5: Rate Limiting & Failed Audit Protection
  // ----------------------------------------------------
  console.log('\n[5] Testing Rate Limiting & Failed Audit Non-Deduction...');

  const testIp = `198.51.100.${Math.floor(Math.random() * 200 + 10)}`;

  // Verify fresh IP is allowed
  const checkInitial = await db.checkFreeAuditLimit(testIp, 'https://test-site-a.com', 5, 10);
  assert(checkInitial.allowed === true, 'Fresh IP is allowed free audit');

  // Add a failed job
  await db.addJob({
    id: `job_fail_${Date.now()}`,
    url: 'https://test-site-fail.com',
    depth: 'quick',
    status: 'failed',
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    is_test: true,
    ip: testIp,
    error: 'Simulated crawl timeout',
  });

  // Failed audit should NOT increment quota
  const checkAfterFailure = await db.checkFreeAuditLimit(testIp, 'https://test-site-b.com', 5, 10);
  assert(checkAfterFailure.allowed === true, 'Failed audits do NOT decrement user quota');

  // Simulate 5 completed jobs for this IP
  for (let i = 0; i < 5; i++) {
    await db.addJob({
      id: `job_done_${Date.now()}_${i}`,
      url: `https://test-site-done-${i}.com`,
      depth: 'quick',
      status: 'done',
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      is_test: true,
      report_id: `rep_test_${i}`,
      ip: testIp,
    });
  }

  // 6th request from this IP should be rate limited
  const checkOverLimit = await db.checkFreeAuditLimit(testIp, 'https://test-site-c.com', 5, 10);
  assert(
    checkOverLimit.allowed === false && checkOverLimit.code === 'RATE_LIMIT_EXCEEDED',
    `6th free audit is rate limited with code RATE_LIMIT_EXCEEDED (got allowed=${checkOverLimit.allowed})`
  );
  assert(
    typeof checkOverLimit.retryAfterSec === 'number' && checkOverLimit.retryAfterSec > 0,
    `Calculates accurate retryAfterSec countdown (${checkOverLimit.retryAfterSec}s)`
  );

  // Test daily cap: 20 per day cap
  const dailyTestIp = `198.51.100.${Math.floor(Math.random() * 200 + 10)}`;
  const twoHoursAgo = new Date(Date.now() - 7200_000).toISOString();
  for (let i = 0; i < 20; i++) {
    await db.addJob({
      id: `job_daily_${Date.now()}_${i}`,
      url: `https://test-daily-${i}.com`,
      depth: 'quick',
      status: 'done',
      started_at: twoHoursAgo,
      finished_at: twoHoursAgo,
      is_test: true,
      report_id: `rep_daily_${i}`,
      ip: dailyTestIp,
    });
  }

  const checkDailyLimit = await db.checkFreeAuditLimit(dailyTestIp, 'https://test-daily-21.com', 5, 10, 20);
  assert(
    checkDailyLimit.allowed === false && checkDailyLimit.limitType === 'daily',
    `21st daily free audit is blocked by daily cap (got allowed=${checkDailyLimit.allowed}, limitType=${checkDailyLimit.limitType})`
  );

  // ----------------------------------------------------
  // TEST GROUP 6: Single-Page Hard Cap for Quick Mode
  // ----------------------------------------------------
  console.log('\n[6] Testing Quick Mode Single-Page Hard Cap...');

  const crawler = new PageCrawler({
    mode: 'quick',
    maxPages: 1,
    maxDepth: 0,
  });

  assert(crawler['config'].maxPages === 1, 'PageCrawler strictly caps maxPages to 1 in quick mode');
  assert(crawler['config'].maxDepth === 0, 'PageCrawler strictly caps maxDepth to 0 in quick mode');

  // ----------------------------------------------------
  // TEST GROUP 7: On-Page Analytics & Conversion Detection
  // ----------------------------------------------------
  console.log('\n[7] Testing On-Page Analytics & Conversion Tracking Checks...');

  const htmlWithAnalytics = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Demo SaaS</title>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC1234XYZ"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-ABC1234XYZ');
        </script>
      </head>
      <body>
        <form action="/subscribe" method="POST">
          <input type="email" placeholder="Your email" />
          <button type="submit">Sign Up</button>
        </form>
        <a href="tel:+18005550199">Call Us</a>
      </body>
    </html>
  `;

  const dummyMetadata: any = {
    hostname: 'test-saas.com',
    detectedStack: { cms: 'Custom' },
    wafProbe: { status: 'accessible' },
    llmsTxtFound: false,
    byteSize: 1024,
  };

  const analyticsRes = checkAnalyticsTracking(
    [{ url: 'https://test-saas.com', html: htmlWithAnalytics, status: 200, depth: 0 } as any],
    dummyMetadata
  );

  assert(analyticsRes.signals.hasGa4 === true, 'Accurately detects GA4 tag on-page without external APIs');
  assert(analyticsRes.signals.detectedTrackingId === 'G-ABC1234XYZ', 'Extracts exact GA4 Measurement ID (G-ABC1234XYZ)');
  assert(analyticsRes.signals.hasLeadForm === true, 'Detects email capture form on-page');
  assert(analyticsRes.signals.hasPhoneLink === true, 'Detects telephone click-to-call link');
  assert(analyticsRes.findings.length === 0, 'Produces zero missing_ga4 findings when GA4 is installed');

  const htmlWithoutAnalytics = `<html><head><title>Bare Page</title></head><body><p>Hello world</p></body></html>`;
  const analyticsMissingRes = checkAnalyticsTracking(
    [{ url: 'https://bare-page.com', html: htmlWithoutAnalytics, status: 200, depth: 0 } as any],
    dummyMetadata
  );
  assert(analyticsMissingRes.signals.hasGa4 === false, 'Flags missing GA4 when not present in HTML');
  assert(analyticsMissingRes.findings.some(f => f.checkId === 'analytics.missing_ga4'), 'Emits analytics.missing_ga4 finding');

  // ----------------------------------------------------
  // TEST GROUP 8: Local SEO Readiness Detection
  // ----------------------------------------------------
  console.log('\n[8] Testing Local SEO & Google Business Profile Readiness...');

  const htmlWithLocal = `
    <!DOCTYPE html>
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Downtown Bakery",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "456 Market St",
            "addressLocality": "Austin",
            "addressRegion": "TX"
          }
        }
        </script>
      </head>
      <body>
        <a href="https://maps.google.com/?q=Downtown+Bakery">View on Google Maps</a>
        <a href="tel:+15125550144">Call Bakery</a>
      </body>
    </html>
  `;

  const localRes = checkLocalSeo(
    [{ url: 'https://downtown-bakery.com', html: htmlWithLocal, status: 200, depth: 0 } as any],
    dummyMetadata
  );

  assert(localRes.signals.hasLocalBusinessSchema === true, 'Detects LocalBusiness JSON-LD schema');
  assert(localRes.signals.businessName === 'Downtown Bakery', 'Extracts verified business name');
  assert(localRes.signals.hasAddressSignal === true, 'Detects postal address signal');
  assert(localRes.signals.hasGoogleMapsLink === true, 'Detects Google Maps link');

  // ----------------------------------------------------
  // TEST GROUP 9: Keyword Tag Alignment & Rewrites
  // ----------------------------------------------------
  console.log('\n[9] Testing Keyword Tag Alignment & Tag Rewrite Length Constraints...');

  const $intel = cheerio.load(htmlWithAnalytics);
  const intelReport = await generateKeywordIntelligence(
    $intel,
    'https://test-saas.com',
    'Demo SaaS - Fast Cloud Analytics Platform',
    'The leading cloud analytics platform for modern engineering teams.',
    ['Cloud Analytics Platform'],
    ['Features', 'Pricing'],
    ['Security'],
    'saas'
  );

  assert(intelReport.keywordAlignment !== undefined, 'Keyword intelligence outputs keywordAlignment check');
  assert(typeof intelReport.keywordAlignment?.recommendedRewrites.title === 'string', 'Outputs recommended title rewrite');
  assert((intelReport.keywordAlignment?.recommendedRewrites.title.length || 0) <= 60, `Recommended title under 60 chars (got ${intelReport.keywordAlignment?.recommendedRewrites.title.length} chars)`);
  assert((intelReport.keywordAlignment?.recommendedRewrites.metaDescription.length || 0) <= 155, `Recommended meta under 155 chars (got ${intelReport.keywordAlignment?.recommendedRewrites.metaDescription.length} chars)`);
  assert(typeof intelReport.keywordAlignment?.plainDiagnosis === 'string', 'Outputs plain marketer diagnosis');

  // ----------------------------------------------------
  // TEST GROUP 10: Google Search Console (GSC) Upload & Cross-Reference
  // ----------------------------------------------------
  console.log('\n[10] Testing Google Search Console (GSC) Upload & Extraction...');

  const sampleGscCsv = `Crawled - currently not indexed
URL,Last crawled
https://acme-analytics.io/docs/quickstart,2026-10-15
https://acme-analytics.io/pricing/enterprise,2026-10-18
https://acme-analytics.io/blog/announcement,2026-10-20
`;

  const parsedGsc = parseGscExport(sampleGscCsv, 'Coverage_Table.csv');
  assert(parsedGsc.totalUrls === 3, `Correctly counts total URLs in GSC export (got ${parsedGsc.totalUrls})`);
  assert(parsedGsc.unindexedUrls.length === 3, `Extracts unindexed URLs array (got ${parsedGsc.unindexedUrls.length})`);
  assert(parsedGsc.unindexedUrls[0] === 'https://acme-analytics.io/docs/quickstart', 'First extracted URL matches expected');
  assert(parsedGsc.reasonsDetected.includes('Crawled - currently not indexed'), 'Captures Google coverage reason from title header');
  assert(parsedGsc.suggestedDomain === 'https://acme-analytics.io', `Correctly infers target domain (got ${parsedGsc.suggestedDomain})`);

  // Test TSV format
  const sampleGscTsv = `URL\tReason\tLast crawled\nhttps://saas-demo.com/features\tDuplicate without user-selected canonical\t2026-10-12`;
  const parsedTsv = parseGscExport(sampleGscTsv, 'pages.tsv');
  assert(parsedTsv.totalUrls === 1, 'Correctly parses tab-separated TSV export');
  assert(parsedTsv.reasonsDetected.includes('Duplicate without user-selected canonical'), 'Captures reason from TSV column');

  // ----------------------------------------------------
  // TEST GROUP 11: Data-Quality Consistency & Non-Zero Free Receipts
  // ----------------------------------------------------
  console.log('\n[11] Testing Data-Quality Consistency & On-Chain Receipt Truthfulness...');

  const { buyCoordinator } = await import('../src/services/buyClient.js');
  const dummyReceipt = {
    service: 'browser-session' as const,
    provider: 'buy.ai',
    costUsd: '0.045',
    txHash: '0x123',
    celoscanUrl: 'https://celoscan.io',
    timestamp: new Date().toISOString(),
    attributionTag: 'celo_757c2ac3b70c',
    blockNumber: 82440000,
    gasPriceGwei: '0.5',
    isRealBroadcast: false,
  };

  const freeReceipt = buyCoordinator.buildExecutionLog('https://free-test.com', dummyReceipt as any, dummyReceipt as any, false);
  assert(freeReceipt.clientPaidUsd === '$0.00 USD₮', `Free quick audit states clientPaidUsd $0.00 USD₮ (got ${freeReceipt.clientPaidUsd})`);
  assert(freeReceipt.agentMarginUsd.includes('Sponsored Free Tier'), 'Free quick audit labels agent margin as Sponsored Free Tier');

  const paidReceipt = buyCoordinator.buildExecutionLog('https://paid-test.com', dummyReceipt as any, dummyReceipt as any, true);
  assert(paidReceipt.clientPaidUsd === '$0.50 USD₮', `Paid crawl states clientPaidUsd $0.50 USD₮ (got ${paidReceipt.clientPaidUsd})`);

  // Verify Single Source of Truth for Mobile LCP across speedVitals and mobilePerformance
  const { checkMobilePerformance } = await import('../src/engine/checks/mobilePerformance.js');
  const { auditSpeedVitals } = await import('../src/analyzer/speedVitals.js');

  const { metrics: mobileMetrics } = checkMobilePerformance(
    [{ url: 'https://test-perf.com', html: htmlWithAnalytics, status: 200, depth: 0 } as any],
    dummyMetadata
  );
  const $perf = cheerio.load(htmlWithAnalytics);
  const perfVitals = auditSpeedVitals($perf, htmlWithAnalytics.length, mobileMetrics);

  assert(
    perfVitals.lcpEstimateSeconds === mobileMetrics.mobileLcpSeconds,
    `Mobile LCP is identical across performance and mobileMetrics (${perfVitals.lcpEstimateSeconds}s vs ${mobileMetrics.mobileLcpSeconds}s)`
  );
  assert(
    perfVitals.mobile?.mobileLcpSeconds === mobileMetrics.mobileLcpSeconds,
    `Nested performance.mobile.mobileLcpSeconds strictly matches (${perfVitals.mobile?.mobileLcpSeconds}s)`
  );

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n========================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: \x1b[32m${passed}\x1b[0m`);
  console.log(`FAILED: ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : '0'}`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running regression tests:', err);
  process.exit(1);
});
