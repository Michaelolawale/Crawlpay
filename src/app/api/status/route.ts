import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    version: '2.0.0',
    agent: 'CrawlPay Technical SEO, AEO & GEO Auditor',
    network: 'Celo Mainnet (42220)',
    endpoints: {
      agentCard: '/.well-known/agent-card.json',
      bazaar: '/api/x402-bazaar',
      agentRegistration: '/api/agent-registration',
      agentStatus: '/api/agent/status',
      audit: '/api/audit',
      verify: '/api/payment/verify',
      reports: '/api/reports',
      config: '/api/config',
    },
  });
}
