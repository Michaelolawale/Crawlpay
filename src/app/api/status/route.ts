import { NextResponse } from 'next/server';
import { getAgentStatus } from '@/agent/wallet';

export async function GET() {
  return NextResponse.json({
    project: 'CrawlPay',
    version: '1.0.0',
    framework: 'Next.js 14 App Router',
    description: 'Autonomous On-Demand SEO & Competitor Intelligence Agent on Celo',
    agent: getAgentStatus(),
    endpoints: {
      audit: 'POST /api/audit',
      compare: 'POST /api/compare',
      bazaar: 'GET /api/x402-bazaar',
    },
  });
}
