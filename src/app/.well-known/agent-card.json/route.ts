import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'crawlpay.org';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const agentCard = {
    schemaVersion: '1.0.0',
    id: `celo:42220:${CONFIG.AGENT_WALLET_ADDRESS}`,
    name: 'CrawlPay Agent',
    description: 'Autonomous technical SEO auditor and competitor intelligence agent on Celo mainnet.',
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
    payment: {
      network: 'celo',
      chainId: CONFIG.CELO_CHAIN_ID,
      payTo: CONFIG.AGENT_WALLET_ADDRESS,
      currency: 'USD₮ / USDC / CELO',
      quickAuditPriceUsd: CONFIG.DEFAULT_AUDIT_PRICE_USD,
      attributionTag: CONFIG.ATTRIBUTION_TAG,
      dataSuffix: CONFIG.DATA_SUFFIX,
    },
    endpoints: {
      audit: `${baseUrl}/api/audit`,
      compare: `${baseUrl}/api/compare`,
      bazaar: `${baseUrl}/api/x402-bazaar`,
      registration: `${baseUrl}/api/agent-registration`,
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
