import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'crawlpay.org';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const registrationDoc = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'CrawlPay SEO & Intelligence Agent',
    description:
      'Autonomous on-demand technical SEO, Core Web Vitals, and competitor intelligence audit agent on Celo mainnet. Replaces expensive monthly SEO subscriptions with granular micropayments per crawl via x402 and buy (gateway.usebuy.ai).',
    image: `${baseUrl}/favicon.ico`,
    services: [
      {
        name: 'web',
        endpoint: baseUrl,
        description: 'Interactive SEO audit dashboard and audit results viewer',
      },
      {
        name: 'x402',
        endpoint: `${baseUrl}/api/audit`,
        version: '1.0.0',
        description: 'Pay-per-audit HTTP 402 SEO intelligence engine',
        methods: ['POST'],
      },
      {
        name: 'bazaar',
        endpoint: `${baseUrl}/api/x402-bazaar`,
        version: '1.0.0',
        description: 'Machine discovery catalog and JSON schema for CrawlPay services',
      },
      {
        name: 'compare',
        endpoint: `${baseUrl}/api/compare`,
        version: '1.0.0',
        description: 'Head-to-head competitor speed, vitals, and keyword gap analysis',
        methods: ['POST'],
      },
    ],
    x402Support: true,
    active: true,
    supportedTrust: ['reputation'],
    celo: {
      chainId: CONFIG.CELO_CHAIN_ID,
      agentWallet: CONFIG.AGENT_WALLET_ADDRESS,
      attributionTag: CONFIG.ATTRIBUTION_TAG,
      dataSuffix: CONFIG.DATA_SUFFIX,
      identityRegistry: CONFIG.ERC8004_REGISTRY,
    },
    bounties: [
      {
        name: 'Build with buy',
        sponsor: 'usebuy.ai',
        gateway: CONFIG.USEBUY_GATEWAY,
      },
    ],
  };

  return NextResponse.json(registrationDoc, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
