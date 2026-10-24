import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';
import { runAuditPipeline } from '@/services/auditRunner';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { jobId } = body;

  const job = db.getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const startTime = Date.now();
  db.updateJob(job.id, { status: 'running', started_at: new Date().toISOString() });

  try {
    const report = await runAuditPipeline(job.url, job.depth, false);
    const duration = Date.now() - startTime;
    const reportId = `rep_${Date.now()}`;
    db.saveReport(reportId, report);

    db.updateJob(job.id, {
      status: 'done',
      finished_at: new Date().toISOString(),
      duration_ms: duration,
      error: undefined,
      report_id: reportId,
    });

    return NextResponse.json({ success: true, job: db.getJob(job.id), reportId });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    db.updateJob(job.id, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      duration_ms: duration,
      error: err?.message || 'Rerun failed',
    });
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
