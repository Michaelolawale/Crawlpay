import { NextRequest, NextResponse } from 'next/server';
import { identityService } from '@/services/identityService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('host') || 'crawlpay.org';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const defaultUri = `${protocol}://${host}/api/agent-registration`;

    const body = await req.json().catch(() => ({}));
    const agentUri = body.agentUri || defaultUri;

    const result = await identityService.registerIdentity(agentUri);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Identity registration failed', details: result },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Identity registration execution failed' },
      { status: 500 }
    );
  }
}
