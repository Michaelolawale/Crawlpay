import { NextRequest, NextResponse } from 'next/server';
import { runAuditPipeline } from '@/services/auditRunner';
import { compareCompetitors } from '@/analyzer/competitorComparator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUrl, competitorUrl } = body;

    if (!targetUrl || !competitorUrl) {
      return NextResponse.json(
        { error: 'Both targetUrl and competitorUrl are required' },
        { status: 400 }
      );
    }

    const [targetReport, competitorReport] = await Promise.all([
      runAuditPipeline(targetUrl),
      runAuditPipeline(competitorUrl),
    ]);

    const comparison = compareCompetitors(targetReport, competitorReport);

    return NextResponse.json({
      targetReport,
      competitorReport,
      comparison,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Comparison execution failed', details: err?.message },
      { status: 500 }
    );
  }
}
