import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config';
import { db } from '@/services/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'crawlpay.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  let quickPrice = CONFIG.DEFAULT_AUDIT_PRICE_USD;
  let fullPrice = '0.50';

  try {
    const config = await db.getConfig();
    if (config?.quick_price_usd) quickPrice = config.quick_price_usd;
    if (config?.full_price_usd) fullPrice = config.full_price_usd;
  } catch {
    // fallback to defaults
  }

  const agentCard = {
    schemaVersion: '2.0.0',
    id: `celo:42220:${CONFIG.AGENT_WALLET_ADDRESS}`,
    name: 'CrawlPay Agent',
    description:
      'Autonomous technical SEO, AEO, and GEO site audit agent on Celo mainnet. Provides zero-fabrication keyword strategy, analytics tracking validation, local SEO readiness, multi-page deep crawling, and stack-tailored 1-click fixes with x402 micropayments.',
    url: baseUrl,
    provider: {
      name: 'CrawlPay Protocol',
      url: baseUrl,
    },
    capabilities: {
      x402: true,
      streaming: false,
      mcp: true,
      a2a: true,
    },
    skills: [
      {
        id: 'technical_seo',
        name: 'Deterministic Technical SEO Crawler',
        description:
          'Multi-page BFS crawler (up to 50 pages) evaluating indexability, canonicals, status codes, robots.txt, XML sitemaps, headings, images, duplicate content, and internal broken links.',
        pricing: {
          quickAuditUsd: quickPrice,
          fullAuditUsd: fullPrice,
          currency: 'USD₮ / USDC / CELO',
        },
      },
      {
        id: 'aeo_geo_analysis',
        name: 'Answer Engine & Generative Engine Optimization',
        description:
          'Audits AI search bot permissions (GPTBot, ClaudeBot, PerplexityBot, Google-Extended), machine FAQPage schema, and direct conversational question headings.',
      },
      {
        id: 'keyword_strategy',
        name: 'Zero-Fabrication Keyword Strategy & Tag Rewrites',
        description:
          'Deterministic search intent classification, primary keyword detection, and 1-click ready Title (<60 chars) & Meta Description (<155 chars) rewrites.',
      },
      {
        id: 'analytics_local_seo',
        name: 'Analytics & Local SEO Signal Verification',
        description:
          'Detects presence of GA4, GTM, Meta Pixel, lead conversion forms, phone links, LocalBusiness schema, and Google Maps presence.',
      },
      {
        id: 'competitor_benchmark',
        name: 'Head-to-Head Competitor Gap Analysis',
        description:
          'Side-by-side PageSpeed vitals, schema depth, and 3 actionable steps to outrank rival websites.',
      },
    ],
    payment: {
      network: 'celo',
      chainId: CONFIG.CELO_CHAIN_ID,
      payTo: CONFIG.AGENT_WALLET_ADDRESS,
      currency: 'USD₮ / USDC / CELO',
      quickAuditPriceUsd: quickPrice,
      fullAuditPriceUsd: fullPrice,
      attributionTag: CONFIG.ATTRIBUTION_TAG,
      dataSuffix: CONFIG.DATA_SUFFIX,
    },
    endpoints: {
      audit: `${baseUrl}/api/audit`,
      compare: `${baseUrl}/api/compare`,
      bazaar: `${baseUrl}/api/x402-bazaar`,
      registration: `${baseUrl}/api/agent-registration`,
      status: `${baseUrl}/api/agent/status`,
      mcpDoc: `${baseUrl}/docs#mcp`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri', description: 'Target website URL to audit' },
        mode: {
          type: 'string',
          enum: ['quick', 'full'],
          default: 'quick',
          description: 'Single-page quick check or deep multi-page crawl (up to 50 pages)',
        },
        competitorUrl: {
          type: 'string',
          format: 'uri',
          description: 'Optional competitor URL for head-to-head comparison',
        },
      },
      required: ['url'],
    },
  };

  return NextResponse.json(agentCard, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

