import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'crawlpay.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const registrationDoc = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'CrawlPay SEO, AEO & GEO Agent',
    description:
      'Autonomous on-demand technical SEO, AEO, and GEO site audit agent on Celo mainnet. Provides zero-fabrication keyword strategy, analytics tracking validation, local SEO readiness, and stack-tailored 1-click fixes with x402 micropayments.',
    image: `${baseUrl}/favicon.ico`,
    services: [
      {
        name: 'web',
        endpoint: baseUrl,
        description: 'Interactive marketer-friendly SEO audit command center and dashboard',
      },
      {
        name: 'x402',
        endpoint: `${baseUrl}/api/audit`,
        version: '2.0.0',
        description: 'Pay-per-audit HTTP 402 SEO, AEO, GEO & analytics intelligence engine',
        methods: ['POST'],
      },
      {
        name: 'bazaar',
        endpoint: `${baseUrl}/api/x402-bazaar`,
        version: '2.0.0',
        description: 'Machine discovery catalog and JSON schema for CrawlPay services',
      },
      {
        name: 'compare',
        endpoint: `${baseUrl}/api/compare`,
        version: '2.0.0',
        description: 'Head-to-head competitor speed, vitals, and actionable win plan',
        methods: ['POST'],
      },
      {
        name: 'status',
        endpoint: `${baseUrl}/api/agent/status`,
        version: '2.0.0',
        description: 'Real-time agent identity, gas balance, and Celo Mainnet telemetry',
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
