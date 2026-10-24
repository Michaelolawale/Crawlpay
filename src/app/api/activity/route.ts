import { NextResponse } from 'next/server';
import { db } from '@/services/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Exclude is_test jobs from public activity
  const nonTestJobs = db.listJobs(false).slice(0, 10);
  const payments = db.listPayments();
  const paymentMap = new Map(payments.map((p) => [p.id, p]));

  const activity = nonTestJobs.map((job) => {
    const payment = job.payment_id ? paymentMap.get(job.payment_id) : undefined;
    const wallet = payment?.wallet || '0xf06c...6b39';
    const txHash = payment?.tx_hash || '0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5';

    return {
      id: job.id,
      url: job.url,
      depth: job.depth,
      status: job.status,
      timestamp: job.finished_at || job.started_at,
      truncatedWallet: `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
      txHash,
      celoscanUrl: `https://celoscan.io/tx/${txHash}`,
    };
  });

  return NextResponse.json({ activity });
}
