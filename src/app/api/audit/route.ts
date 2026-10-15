import { NextRequest, NextResponse } from 'next/server';
import { runAuditPipeline } from '@/services/auditRunner';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    const report = await runAuditPipeline(url);
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Audit execution failed', details: err?.message },
      { status: 500 }
    );
  }
}
