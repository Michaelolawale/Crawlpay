import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';
import { verifyAdminAuth } from '@/utils/adminAuth';
import exampleReportData from '@/data/exampleReport.json';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  const { id } = params;

  if (id === 'rep_evangel_example' || id === 'job_evangel_example') {
    return NextResponse.json({
      report: exampleReportData,
      meta: {
        id: 'rep_evangel_example',
        targetUrl: 'https://evangelcarriersnetwork.org',
        wallet: '0xf06c2b754d07cba299751f0985a48f8013bb6b39',
        isExample: true,
      },
    });
  }

  let report = await db.getReport(id);

  // If not found by report ID, check if it was a job ID
  let linkedJob = await db.getJob(id);
  if (!report && linkedJob?.report_id) {
    report = await db.getReport(linkedJob.report_id);
  }

  if (!report) {
    // Check fallback example
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({
    report,
    job: linkedJob || null,
  });
}

