import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  const reports = await db.listReportsForWallet();
  const jobs = await db.listJobs();
  const reportJobMap = new Map(jobs.filter((j) => j.report_id).map((j) => [j.report_id, j]));

  const enriched = reports.map((r) => {
    const linkedJob = reportJobMap.get(r.id);
    const repData = (r as any).report_data || {};
    return {
      id: r.id,
      targetUrl: r.target_url || repData.targetUrl || 'Unknown Target',
      wallet: r.wallet || linkedJob?.wallet || null,
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
    };
  });

  return NextResponse.json({
    reports: enriched,
    totalCount: enriched.length,
  });
}
