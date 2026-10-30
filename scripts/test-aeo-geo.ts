import { RobotsParser } from '../src/engine/utils/robotsParser';
import { checkAEO } from '../src/engine/checks/aeo';
import { checkGEO } from '../src/engine/checks/geo';
import { PageCrawlData, SiteMetadata } from '../src/engine/types';
import { runAuditPipeline } from '../src/services/auditRunner';

console.log('=== TEST 1: RFC 9309 ROBOTS.TXT PARSER ===');
const sampleRobotsTxt = `
# Comment block
User-agent: Googlebot
Disallow: /private/

User-agent: GPTBot
Disallow: /ai-restricted/
Allow: /ai-restricted/public/

User-agent: *
Disallow: /admin/
Allow: /
`;

const parser = new RobotsParser(sampleRobotsTxt, 'CrawlPayBot');

// 1. GPTBot specific rule check
const gptBlocked = parser.evaluateBot('GPTBot', '/ai-restricted/document.pdf');
console.log('GPTBot on /ai-restricted/document.pdf:', gptBlocked);
console.assert(gptBlocked.status === 'blocked', 'Should be blocked');
console.assert(gptBlocked.rulePrecedence === 'specific_user_agent', 'Precedence should be specific_user_agent');

// 2. GPTBot longest-match Allow check
const gptAllowed = parser.evaluateBot('GPTBot', '/ai-restricted/public/data.json');
console.log('GPTBot on /ai-restricted/public/data.json:', gptAllowed);
console.assert(gptAllowed.status === 'allowed', 'Should be allowed by longest match Allow');

// 3. ClaudeBot fallback to wildcard *
const claudeAdmin = parser.evaluateBot('ClaudeBot', '/admin/login');
console.log('ClaudeBot on /admin/login:', claudeAdmin);
console.assert(claudeAdmin.status === 'blocked', 'Should be blocked by wildcard *');
console.assert(claudeAdmin.rulePrecedence === 'wildcard_fallback', 'Precedence should be wildcard_fallback');

// 4. Failed fetch robots returns unknown
const failedParser = new RobotsParser(undefined, 'CrawlPayBot', true);
const unknownBot = failedParser.evaluateBot('GPTBot', '/');
console.log('Failed fetch evaluation:', unknownBot);
console.assert(unknownBot.status === 'unknown', 'Should be unknown on fetch failure');

console.log('\n=== TEST 2: AEO DISCRETE CHECKS ===');
const mockPages: PageCrawlData[] = [
  {
    url: 'https://example.com/',
    finalUrl: 'https://example.com/',
    status: 200,
    redirectChain: [],
    headers: {},
    html: `
      <html>
        <body>
          <h1>CrawlPay Overview</h1>
          <h2>What is CrawlPay and how does it work?</h2>
          <p>CrawlPay is an autonomous SEO agent on Celo Mainnet.</p>
          <h3>Best Coffee Machines in 2026</h3>
          <ol><li>Step 1</li><li>Step 2</li></ol>
        </body>
      </html>
    `,
    title: 'CrawlPay',
    metaDescription: 'CrawlPay SEO agent',
    canonical: 'https://example.com/',
    robotsMeta: '',
    h1ToH6: {
      h1s: ['CrawlPay Overview'],
      h2s: ['What is CrawlPay and how does it work?'],
      h3s: ['Best Coffee Machines in 2026'],
      h4s: [],
      h5s: [],
      h6s: [],
      hierarchy: [
        { level: 1, text: 'CrawlPay Overview' },
        { level: 2, text: 'What is CrawlPay and how does it work?' },
        { level: 3, text: 'Best Coffee Machines in 2026' },
      ],
    },
    links: [],
    images: [],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is CrawlPay?',
            acceptedAnswer: { '@type': 'Answer', text: 'An autonomous agent on Celo.' },
          },
        ],
      },
    ],
    textHash: '12345',
    depth: 0,
    inboundInternalLinks: 0,
    isClientRendered: false,
    byteSize: 1024,
  },
];

const mockMetadata: SiteMetadata = {
  baseUrl: 'https://example.com',
  hostname: 'example.com',
  detectedStack: { cms: 'Next.js' },
  sitemapFound: true,
  sitemapUrls: ['https://example.com/'],
  robotsTxtFound: true,
  llmsTxtFound: true,
  wafProbe: { accessible: true, status: 200 },
};

const aeoResult = checkAEO(mockPages, mockMetadata);
console.log('AEO Signals:', aeoResult.signals);
console.log('AEO Findings Count:', aeoResult.findings.length);
console.assert(aeoResult.signals.questionHeadingsCount === 1, 'Should detect exactly 1 question heading ("What is...")');
console.assert(aeoResult.signals.hasFaqSchema === true, 'Should detect FAQPage schema');

console.log('\n=== TEST 3: GEO DISCRETE CHECKS ===');
const geoResult = checkGEO(mockPages, mockMetadata, parser, mockMetadata.wafProbe, mockMetadata.llmsTxtFound);
console.log('GEO Signals:', geoResult.signals);
console.log('GEO Findings:', geoResult.findings.map((f) => f.checkId));
console.assert(geoResult.signals.hasLlmsTxt === true, 'Should recognize llms.txt');
console.assert(geoResult.signals.wafStatus === 'accessible', 'WAF status should be accessible');

console.log('\n=== ALL UNIT ASSERTIONS PASSED! ===');

