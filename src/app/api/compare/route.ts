import { NextRequest, NextResponse } from 'next/server';
import { runAuditPipeline } from '@/services/auditRunner';
import { compareCompetitors } from '@/analyzer/competitorComparator';
import { auditRateLimiter } from '@/utils/security';

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const rateCheck = auditRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before running more audits.',
          retryAfterSec: rateCheck.retryAfterSec,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSec || 60),
          },
        }
      );
    }

    const body = await req.json();
    const { targetUrl, competitorUrl, mode = 'quick' } = body;

    if (!targetUrl || !competitorUrl) {
      return NextResponse.json(
        { error: 'Both targetUrl and competitorUrl are required' },
        { status: 400 }
      );
    }

    const crawlMode = mode === 'full' ? 'full' : 'quick';
    const [targetReport, competitorReport] = await Promise.all([
      runAuditPipeline(targetUrl, crawlMode, false),
      runAuditPipeline(competitorUrl, 'quick', false),
    ]);

    const comparison = compareCompetitors(targetReport, competitorReport);

    return NextResponse.json({
      targetReport,
      competitorReport,
      comparison,
    });
  } catch (err: any) {
    const isSecurityError = err?.message?.includes('SSRF') || err?.message?.includes('prohibited');
    return NextResponse.json(
      { error: err?.message || 'Comparison execution failed' },
      { status: isSecurityError ? 400 : 500 }
    );
  }
}
