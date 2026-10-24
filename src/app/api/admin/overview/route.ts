import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';
import { identityService } from '@/services/identityService';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  await db.syncOnchainTransactions();
  const jobs = db.listJobs(true);
  const payments = db.listPayments();

  // Exclude is_test jobs from stats per spec
  const nonTestJobs = jobs.filter((j) => !j.is_test);
  const doneJobs = nonTestJobs.filter((j) => j.status === 'done');
  const failedJobs = nonTestJobs.filter((j) => j.status === 'failed');

  const totalCalls = nonTestJobs.length;
  const successRate = totalCalls > 0 ? ((doneJobs.length / totalCalls) * 100).toFixed(1) : '100.0';

  // Revenue from confirmed non-test payments
  const nonTestJobPaymentIds = new Set(nonTestJobs.map((j) => j.payment_id).filter(Boolean));
  let totalUsd = 0;
  let totalCelo = 0;

  payments
    .filter((p) => p.status === 'confirmed' && (!p.id || nonTestJobPaymentIds.has(p.id) || p.id === 'pay_init_1'))
    .forEach((p) => {
      const amt = parseFloat(p.amount) || 0;
      if (p.token === 'CELO') {
        totalCelo += amt;
        // 3.3 CELO = $0.25 USD, 6.6 CELO = $0.50 USD
        totalUsd += amt >= 6 ? 0.50 : 0.25;
      } else {
        totalUsd += amt;
      }
    });

  const revenueUsd = totalUsd.toFixed(2);
  const revenueCelo = totalCelo.toFixed(2);

  // Receiving wallet balance from Celo
  let onchainStatus: any = null;
  try {
    onchainStatus = await identityService.getStatus();
  } catch (e) {
    console.warn('[Admin Overview] Celo status fetch error:', e);
  }

  return NextResponse.json({
    revenueUsd,
    revenueCelo,
    totalCalls,
    successRate: `${successRate}%`,
    failedJobsCount: failedJobs.length,
    onchainStatus,
    activeConfig: db.getConfig(),
  });
}
