import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/services/adminService';
import { db } from '@/services/db';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeTest = searchParams.get('includeTest') === 'true';

  const [overview, activeConfig] = await Promise.all([
    adminService.getOverview(includeTest),
    db.getConfig(),
  ]);

  return NextResponse.json(
    {
      ...overview.metrics,
      activeConfig,
      recentJobs: overview.recentJobs,
      recentPayments: overview.recentPayments,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
