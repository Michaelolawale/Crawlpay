import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.syncOnchainTransactions();
  const payments = await db.listPayments();
  return NextResponse.json({ payments });
}
