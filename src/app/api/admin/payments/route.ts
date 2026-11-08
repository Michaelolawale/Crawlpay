import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.syncOnchainTransactions();
  const [payments, jobs] = await Promise.all([db.listPayments(), db.listJobs(true)]);

  const paymentsWithJob = payments.map((p) => {
    const job = jobs.find(
      (j) => j.payment_id === p.id || (p.tx_hash && j.id.includes(p.tx_hash.slice(2, 10)))
    );
    return {
      ...p,
      job: job
        ? {
            id: job.id,
            url: job.url,
            depth: job.depth,
            status: job.status,
            report_id: job.report_id,
          }
        : null,
    };
  });

  return NextResponse.json({ payments: paymentsWithJob });
}
