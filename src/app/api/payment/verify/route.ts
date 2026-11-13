import { NextRequest, NextResponse } from 'next/server';
import { identityService } from '@/services/identityService';
import { db } from '@/services/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { txHash, url, mode = 'quick' } = body;

    if (!txHash) {
      return NextResponse.json({ error: 'Missing txHash parameter' }, { status: 400 });
    }

    const verification = await identityService.verifyPaymentTx(txHash);

    if (verification.valid && verification.mined && verification.isToAgent) {
      const existingPayment = await db.getPaymentByTxHash(txHash);

      const payId = existingPayment ? existingPayment.id : `pay_${Date.now()}_${txHash.slice(2, 8)}`;
      const isUsdt = verification.token === 'USDT' || Boolean(verification.valueUsdt);
      const isCelo = !isUsdt && Number(verification.valueCelo || 0) > 0;
      const dynamicConfig = await db.getConfig().catch(() => null);
      const defaultUsdtPrice = dynamicConfig?.full_price_usd || '0.50';
      const paymentAmount = isUsdt ? (verification.valueUsdt || defaultUsdtPrice) : (verification.valueCelo || '6.60');
      const paymentToken = isUsdt ? 'USDT' : 'CELO';

      if (!existingPayment) {
        await db.addPayment({
          id: payId,
          wallet: verification.from || 'unknown',
          amount: paymentAmount,
          token: paymentToken,
          chain_id: 42220,
          tx_hash: txHash,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(verification);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
