import { NextRequest, NextResponse } from 'next/server';
import { identityService } from '@/services/identityService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { txHash } = body;

    if (!txHash) {
      return NextResponse.json({ error: 'Missing txHash parameter' }, { status: 400 });
    }

    const verification = await identityService.verifyPaymentTx(txHash);
    return NextResponse.json(verification);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
