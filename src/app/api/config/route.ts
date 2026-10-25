import { NextResponse } from 'next/server';
import { db } from '@/services/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await db.getConfig();
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        quick_price_usd: '0.25',
        full_price_usd: '0.50',
        crawl_timeout_ms: 7000,
        max_pages_full: 50,
        rate_limit_per_minute: 20,
      },
      { status: 200 }
    );
  }
}
