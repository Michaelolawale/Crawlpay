import { NextRequest, NextResponse } from 'next/server';
import { identityService } from '@/services/identityService';
import { verifyAdminAuth } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Protect agent identity contract - require operator authentication
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Operator passkey required for identity registration' }, { status: 401 });
  }

  try {
    const host = req.headers.get('host') || 'crawlpay.vercel.app';
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
