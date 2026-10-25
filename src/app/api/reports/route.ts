import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet') || undefined;

  const rawReports = await db.listReportsForWallet(wallet);

  // Map to the shape expected by the frontend
  const reports = rawReports.map((item) => {
    const reportData = item.report_data || {};
    const prioritizedGroups = reportData.prioritizedGroups || [];

    return {
      id: item.id,
      date: item.created_at,
      targetUrl: item.target_url,
      mode: item.mode,
      wallet: item.wallet,
      pagesChecked: reportData.pagesChecked || (item.mode === 'quick' ? 1 : 10),
      issuesCount: {
        critical: prioritizedGroups.filter((g: any) => g.severity === 'critical').length,
        high: prioritizedGroups.filter((g: any) => g.severity === 'high').length,
        medium: prioritizedGroups.filter((g: any) => g.severity === 'medium').length,
        low: prioritizedGroups.filter((g: any) => g.severity === 'low').length,
        total: prioritizedGroups.length,
      },
      reportData,
    };
  });

  return NextResponse.json({ reports });
}
