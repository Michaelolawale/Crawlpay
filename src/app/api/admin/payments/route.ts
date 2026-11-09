import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/services/adminService';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeTest = searchParams.get('includeTest') === 'true';

  const data = await adminService.getPayments(includeTest);

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
