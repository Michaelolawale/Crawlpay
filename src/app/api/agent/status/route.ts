import { NextResponse } from 'next/server';
import { identityService } from '@/services/identityService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await identityService.getStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch agent status' },
      { status: 500 }
    );
  }
}
