import { NextRequest, NextResponse } from 'next/server';
import { identityService } from '@/services/identityService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get('host') || 'crawlpay.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const status = await identityService.getStatus();
    return NextResponse.json({
      ...status,
      agentVersion: '2.0.0',
      capabilities: [
        'technical_seo_crawl',
        'aeo_geo_optimization',
        'keyword_strategy_tag_rewrites',
        'analytics_conversion_tracking',
        'local_seo_schema_maps',
        'competitor_gap_benchmark',
      ],
      supportedModes: ['quick', 'full'],
      endpoints: {
        agentCard: `${baseUrl}/.well-known/agent-card.json`,
        registration: `${baseUrl}/api/agent-registration`,
        bazaar: `${baseUrl}/api/x402-bazaar`,
        audit: `${baseUrl}/api/audit`,
        compare: `${baseUrl}/api/compare`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch agent status' },
      { status: 500 }
    );
  }
}

