import { NextResponse } from 'next/server';
import { db } from '@/services/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Exclude is_test jobs from public activity and sort newest first
  const nonTestJobs = db
    .listJobs(false)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 10);

  const payments = db.listPayments();
  const paymentMap = new Map(payments.map((p) => [p.id, p]));

  const activity = nonTestJobs.map((job) => {
    const payment = job.payment_id ? paymentMap.get(job.payment_id) : undefined;
    const wallet = payment?.wallet || '0x' + job.id.slice(4, 12) + '...';
    const txHash = payment?.tx_hash;

    return {
      id: job.id,
      url: job.url,
      depth: job.depth,
      status: job.status,
      timestamp: job.finished_at || job.started_at,
      truncatedWallet: wallet.startsWith('0x') && wallet.length >= 10
        ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
        : wallet,
      txHash,
      celoscanUrl: txHash ? `https://celoscan.io/tx/${txHash}` : undefined,
    };
  });

  return NextResponse.json({ activity });
}
