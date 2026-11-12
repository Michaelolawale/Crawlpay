import { NextRequest, NextResponse } from 'next/server';
import { db, isDemoRecord } from '@/services/db';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { maskAddress } from '@/utils/currency';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeTest = searchParams.get('includeTest') === 'true';

  const [reports, jobs] = await Promise.all([
    db.listReportsForWallet(),
    db.listJobs(true),
  ]);

  const reportJobMap = new Map(jobs.filter((j) => j.report_id).map((j) => [j.report_id, j]));

  const filtered = reports.filter((r) => {
    const linkedJob = reportJobMap.get(r.id);
    const isDemo = isDemoRecord(r) || (linkedJob ? isDemoRecord(linkedJob) : false);
    if (!includeTest && isDemo) return false;
    return true;
  });

  const enriched = filtered.map((r) => {
    const linkedJob = reportJobMap.get(r.id);
    const repData = (r as any).report_data || {};
    const rawWallet = r.wallet || linkedJob?.wallet || null;
    return {
      id: r.id,
      targetUrl: r.target_url || repData.targetUrl || 'Unknown Target',
      wallet: rawWallet,
      maskedWallet: maskAddress(rawWallet),
      mode: r.mode || (repData.pagesChecked > 1 ? 'full' : 'quick'),
      pagesChecked: repData.pagesChecked || (linkedJob?.depth === 'full' ? 50 : 1),
      createdAt: r.created_at || (r as any).timestamp || new Date().toISOString(),
      score: repData.scores?.overall ?? null,
      technicalScore: repData.scores?.technical ?? null,
      aeoScore: repData.scores?.aeo ?? null,
      geoScore: repData.scores?.geo ?? null,
      issuesCount: {
        critical: repData.topNeedleMovers?.filter((m: any) => m.priority === 'Critical').length || 0,
        high: repData.topNeedleMovers?.filter((m: any) => m.priority === 'High').length || 0,
      },
      hasReportData: Boolean(repData.summary || repData.scores),
      isTest: Boolean(linkedJob?.is_test || r.id.includes('test') || r.id.includes('sandbox')),
    };
  });

  return NextResponse.json(
    {
      reports: enriched,
      totalCount: enriched.length,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
