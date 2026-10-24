import { NextResponse } from 'next/server';
import { db } from '@/services/db';

export const dynamic = 'force-dynamic';

function maskDomain(urlStr: string): string {
  try {
    let raw = urlStr.trim();
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = 'https://' + raw;
    }
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, '');
    const lastDot = host.lastIndexOf('.');
    if (lastDot > 0) {
      const name = host.slice(0, lastDot);
      const tld = host.slice(lastDot); // e.g. .com, .io
      if (name.length <= 3) {
        return `${name[0]}*${name.slice(-1)}${tld}`;
      }
      return `${name.slice(0, 2)}***${name.slice(-2)}${tld}`;
    }
    return host.length > 4 ? `${host.slice(0, 2)}***${host.slice(-2)}` : 'dom***.com';
  } catch {
    return 'dom***.com';
  }
}

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
      url: maskDomain(job.url),
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

