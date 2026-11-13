import { NextRequest, NextResponse } from 'next/server';
import { identityService } from '@/services/identityService';
import { db } from '@/services/db';
import { CONFIG } from '@/config';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Protect agent wallet gas - require operator authentication
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Operator passkey required to broadcast transactions' }, { status: 401 });
  }

  try {
    const result = await identityService.sendAttributedPing();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Broadcast failed', details: result },
        { status: 400 }
      );
    }

    if (result.txHash) {
      await db.addPayment({
        id: `pay_ping_${Date.now()}`,
        wallet: CONFIG.AGENT_WALLET_ADDRESS,
        amount: '0.00',
        token: 'CELO',
        chain_id: 42220,
        tx_hash: result.txHash,
        status: 'confirmed',
        type: 'agent_sponsored',
        is_test: false,
        created_at: new Date().toISOString(),
      }).catch(() => {});
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Attributed transaction broadcast failed' },
      { status: 500 }
    );
  }
}
