import { NextRequest, NextResponse } from 'next/server';
import { runAuditPipeline } from '@/services/auditRunner';
import { auditRateLimiter } from '@/utils/security';
import { CONFIG } from '@/config';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting check
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

    const body = await req.json().catch(() => ({}));
    const { url, mode = 'quick', requirePaid = false, paymentProof } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    // 2. Check for x402 Payment Headers or Body proof
    const authHeader = req.headers.get('authorization') || req.headers.get('x-payment');
    const incomingTxHash = typeof paymentProof === 'string' && paymentProof.startsWith('0x') && paymentProof.length === 66
      ? paymentProof
      : (authHeader && authHeader.toLowerCase().includes('0x') ? authHeader.split(' ').pop() : undefined);

    let isVerifiedPaid = false;
    let verifiedPaymentInfo: any = null;

    if (incomingTxHash) {
      const { identityService } = await import('@/services/identityService');
      const verification = await identityService.verifyPaymentTx(incomingTxHash);
      if (verification.mined) {
        isVerifiedPaid = true;
        verifiedPaymentInfo = verification;
      }
    } else if (paymentProof || (authHeader && authHeader.toLowerCase().includes('x402'))) {
      // Direct machine or simulated proof
      isVerifiedPaid = true;
    }

    // 3. If caller explicitly requests machine paid tier without payment, challenge with compliant HTTP 402
    const acceptHeader = req.headers.get('accept') || '';
    if ((requirePaid || acceptHeader.includes('application/x402+json')) && !isVerifiedPaid) {
      return NextResponse.json(
        {
          status: 402,
          error: 'Payment Required',
          priceUsd: CONFIG.DEFAULT_AUDIT_PRICE_USD,
          currency: 'USD₮ / USDC / CELO',
          network: 'celo-mainnet',
          chainId: CONFIG.CELO_CHAIN_ID,
          payTo: CONFIG.AGENT_WALLET_ADDRESS,
          attributionTag: CONFIG.ATTRIBUTION_TAG,
          dataSuffix: CONFIG.DATA_SUFFIX,
          facilitator: CONFIG.USEBUY_GATEWAY,
          bazaar: 'GET /api/x402-bazaar',
          identityRegistry: CONFIG.ERC8004_REGISTRY,
        },
        {
          status: 402,
          headers: {
            'WWW-Authenticate': 'x402',
            'X-Accept-Payment': `USDT; amount=${CONFIG.DEFAULT_AUDIT_PRICE_USD}; network=celo; recipient=${CONFIG.AGENT_WALLET_ADDRESS}; attribution=${CONFIG.ATTRIBUTION_TAG}`,
          },
        }
      );
    }

    const crawlMode = mode === 'full' ? 'full' : 'quick';
    const report = await runAuditPipeline(url, crawlMode, isVerifiedPaid);

    if (verifiedPaymentInfo) {
      report.onchainReceipt.isRealBroadcast = true;
      report.onchainReceipt.upstreamBrowserReceipt.txHash = incomingTxHash!;
      report.onchainReceipt.upstreamBrowserReceipt.celoscanUrl = `https://celoscan.io/tx/${incomingTxHash}`;
      report.onchainReceipt.upstreamBrowserReceipt.isRealBroadcast = true;
    }

    return NextResponse.json(report);
  } catch (err: any) {
    const isSecurityError = err?.message?.includes('SSRF') || err?.message?.includes('prohibited');
    return NextResponse.json(
      { error: err?.message || 'Audit execution failed' },
      { status: isSecurityError ? 400 : 500 }
    );
  }
}
