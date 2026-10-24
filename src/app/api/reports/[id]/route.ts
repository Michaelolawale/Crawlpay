import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';
import exampleReportData from '@/data/exampleReport.json';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (id === 'rep_evangel_example' || id === 'job_evangel_example') {
    return NextResponse.json(exampleReportData);
  }

  const report = db.getReport(id);
  if (report) {
    return NextResponse.json(report);
  }

  return NextResponse.json({ error: 'Report not found' }, { status: 404 });
}
