import { NextResponse } from 'next/server';
import { CONFIG } from '@/config';
import { db } from '@/services/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await db.getConfig();
  return NextResponse.json(
    {
      status: 402,
      message: 'Payment Required',
      currency: 'USDC / USD₮',
      network: 'celo-mainnet',
      chainId: 42220,
      price: config.quick_price_usd || CONFIG.DEFAULT_AUDIT_PRICE_USD,
      payTo: CONFIG.AGENT_WALLET_ADDRESS,
      attributionTag: CONFIG.ATTRIBUTION_TAG,
      bazaar: {
        name: 'CrawlPay SEO & Intelligence Agent',
        version: '1.0.0',
        description: 'On-demand technical SEO, Core Web Vitals, and competitor analysis paid per call over x402',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri', description: 'Target website URL to audit' },
            competitorUrl: { type: 'string', format: 'uri', description: 'Optional competitor URL for head-to-head comparison' },
          },
          required: ['url'],
        },
      },
    },
    { status: 402 }
  );
}
