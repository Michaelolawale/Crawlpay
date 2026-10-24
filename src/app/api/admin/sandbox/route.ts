import { NextRequest, NextResponse } from 'next/server';
import { runAuditPipeline } from '@/services/auditRunner';
import { db } from '@/services/db';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Enforce Server-Side Auth
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin credentials required to access sandbox' },
      { status: 401 }
    );
  }

  // 2. Enforce Server-Side Environment Flag
  if (process.env.ENABLE_SANDBOX !== 'true') {
    return NextResponse.json(
      { error: 'Forbidden: Sandbox environment is disabled on this server (ENABLE_SANDBOX != true)' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { url, mode = 'quick' } = body;

  if (!url) {
    return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
  }

  const jobId = `job_sandbox_${Date.now()}`;
  const startTime = Date.now();

  // 3. Mark job strictly as is_test = true in DB
  db.addJob({
    id: jobId,
    url,
    depth: mode === 'full' ? 'full' : 'quick',
    status: 'running',
    started_at: new Date().toISOString(),
    is_test: true, // Crucial: excluded from revenue, call counts, and public activity
  });

  try {
    // Run audit pipeline
    const report = await runAuditPipeline(url, mode === 'full' ? 'full' : 'quick', false);
    const duration = Date.now() - startTime;
    const reportId = `rep_sandbox_${Date.now()}`;

    db.saveReport(reportId, report);

    db.updateJob(jobId, {
      status: 'done',
      finished_at: new Date().toISOString(),
      duration_ms: duration,
      report_id: reportId,
    });

    return NextResponse.json({
      success: true,
      is_test: true,
      jobId,
      reportId,
      report,
    });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    db.updateJob(jobId, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      duration_ms: duration,
      error: err?.message || 'Sandbox execution failed',
    });

    return NextResponse.json(
      { error: err?.message || 'Sandbox audit failed', jobId },
      { status: 500 }
    );
  }
}
