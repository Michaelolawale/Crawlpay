import { NextResponse } from 'next/server';
import { identityService } from '@/services/identityService';

export const dynamic = 'force-dynamic';

export async function POST() {
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
