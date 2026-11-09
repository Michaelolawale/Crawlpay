import { NextRequest, NextResponse } from 'next/server';
import { identityService } from '@/services/identityService';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const result = await identityService.sendAttributedPing();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Broadcast failed', details: result },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Attributed transaction broadcast failed' },
      { status: 500 }
    );
  }
}

