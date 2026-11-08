import { NextResponse } from 'next/server';
import { CONFIG } from '@/config';
import { db } from '@/services/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let quickPrice = CONFIG.DEFAULT_AUDIT_PRICE_USD;
  let fullPrice = '0.50';

  try {
    const config = await db.getConfig();
    if (config?.quick_price_usd) quickPrice = config.quick_price_usd;
    if (config?.full_price_usd) fullPrice = config.full_price_usd;
  } catch {
    // fallback to defaults
  }

  return NextResponse.json(
    {
      status: 402,
      message: 'Payment Required',
      currency: 'USDT',
      tokenAddress: CONFIG.CELO_USDT_ADDRESS,
      tokenDecimals: CONFIG.USDT_DECIMALS,
      network: 'celo-mainnet',
      chainId: CONFIG.CELO_CHAIN_ID,
      payTo: CONFIG.AGENT_WALLET_ADDRESS,
      attributionTag: CONFIG.ATTRIBUTION_TAG,
      dataSuffix: CONFIG.DATA_SUFFIX,
      facilitator: CONFIG.USEBUY_GATEWAY,
      pricing: {
        quickAuditUsd: quickPrice,
        fullAuditUsd: fullPrice,
      },
      bazaar: {
        name: 'CrawlPay SEO, AEO & GEO Agent',
        version: '2.0.0',
        description:
          'Autonomous technical SEO, AEO, and GEO site audit agent on Celo mainnet. Zero-fabrication keyword strategy, GA4/GTM analytics tracking verification, local SEO readiness, and stack-tailored 1-click fixes with x402 micropayments.',
        capabilities: [
          'technical_seo_crawl',
          'aeo_geo_optimization',
          'keyword_strategy_tag_rewrites',
          'analytics_conversion_tracking',
          'local_seo_schema_maps',
          'competitor_gap_benchmark',
        ],
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri', description: 'Target website URL to audit' },
            mode: {
              type: 'string',
              enum: ['quick', 'full'],
              default: 'quick',
              description: 'Single-page quick check or multi-page full deep crawl (up to 50 pages)',
            },
            competitorUrl: {
              type: 'string',
              format: 'uri',
              description: 'Optional rival domain to benchmark head-to-head',
            },
            paymentProof: {
              type: 'string',
              description: 'Optional Celo transaction hash (0x...) for pre-paid execution',
            },
          },
          required: ['url'],
        },
        endpoints: {
          audit: 'POST /api/audit',
          compare: 'POST /api/compare',
          registration: 'GET /api/agent-registration',
          status: 'GET /api/agent/status',
          agentCard: 'GET /.well-known/agent-card.json',
        },
      },
    },
    {
      status: 402,
      headers: {
        'WWW-Authenticate': 'x402',
        'X-Accept-Payment': `USDT; amount=${fullPrice}; network=celo; chainId=${CONFIG.CELO_CHAIN_ID}; recipient=${CONFIG.AGENT_WALLET_ADDRESS}; tokenAddress=${CONFIG.CELO_USDT_ADDRESS}; decimals=${CONFIG.USDT_DECIMALS}; attribution=${CONFIG.ATTRIBUTION_TAG}`,
      },
    }
  );
}

