import { NextRequest, NextResponse } from 'next/server';
import { runAuditPipeline } from '@/services/auditRunner';
import { auditRateLimiter } from '@/utils/security';
import { CONFIG } from '@/config';
import { db } from '@/services/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let createdJobId: string | undefined;

  try {
    // 1. Rate Limiting and Blocklist checks
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    if (db.isBlocklisted('ip', ip)) {
      return NextResponse.json(
        { error: 'Access denied: IP address is blocklisted.' },
        { status: 403 }
      );
    }

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
    const { url, mode = 'quick', requirePaid = false, paymentProof, wallet } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    // Check domain blocklist
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (db.isBlocklisted('domain', parsed.hostname)) {
        return NextResponse.json(
          { error: `Access denied: Domain '${parsed.hostname}' is blocklisted.` },
          { status: 403 }
        );
      }
    } catch {}

    // Check wallet blocklist
    if (wallet && db.isBlocklisted('wallet', wallet)) {
      return NextResponse.json(
        { error: 'Access denied: Wallet address is blocklisted.' },
        { status: 403 }
      );
    }

    // 2. Check for x402 Payment Headers or Body proof
    const authHeader = req.headers.get('authorization') || req.headers.get('x-payment');
    const incomingTxHash = typeof paymentProof === 'string' && paymentProof.startsWith('0x') && paymentProof.length === 66
      ? paymentProof
      : (authHeader && authHeader.toLowerCase().includes('0x') ? authHeader.split(' ').pop() : undefined);

    let isVerifiedPaid = false;
    let verifiedPaymentInfo: any = null;
    let paymentId: string | undefined;

    if (incomingTxHash) {
      // Replay prevention: verify tx hash has not been previously used
      const existingPayment = db.getPaymentByTxHash(incomingTxHash);
      if (existingPayment) {
        return NextResponse.json(
          { error: 'Transaction hash has already been used for a previous audit.' },
          { status: 400 }
        );
      }

      const { identityService } = await import('@/services/identityService');
      const verification = await identityService.verifyPaymentTx(incomingTxHash);
      if (verification.mined) {
        isVerifiedPaid = true;
        verifiedPaymentInfo = verification;

        // Log payment in database
        paymentId = `pay_${Date.now()}`;
        db.addPayment({
          id: paymentId,
          wallet: verification.from || wallet || 'unknown',
          amount: mode === 'full' ? '0.50' : '0.25',
          token: 'USDT',
          chain_id: CONFIG.CELO_CHAIN_ID,
          tx_hash: incomingTxHash,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        });
      }
    } else if (paymentProof || (authHeader && authHeader.toLowerCase().includes('x402'))) {
      // Direct machine or simulated proof
      isVerifiedPaid = true;
    }

    // 3. Challenge with compliant HTTP 402 if unpaid machine tier
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

    // 4. Log job in database as running
    createdJobId = `job_${Date.now()}`;
    const crawlMode = mode === 'full' ? 'full' : 'quick';

    db.addJob({
      id: createdJobId,
      payment_id: paymentId,
      url,
      depth: crawlMode,
      status: 'running',
      started_at: new Date().toISOString(),
      is_test: false,
    });

    // 5. Execute audit pipeline
    const report = await runAuditPipeline(url, crawlMode, isVerifiedPaid);
    const duration = Date.now() - startTime;
    const reportId = `rep_${Date.now()}`;

    // Save report in persistent store
    db.saveReport(reportId, report);

    if (verifiedPaymentInfo) {
      report.onchainReceipt.isRealBroadcast = true;
      report.onchainReceipt.upstreamBrowserReceipt.txHash = incomingTxHash!;
      report.onchainReceipt.upstreamBrowserReceipt.celoscanUrl = `https://celoscan.io/tx/${incomingTxHash}`;
      report.onchainReceipt.upstreamBrowserReceipt.isRealBroadcast = true;
    }

    // Update job status to done
    db.updateJob(createdJobId, {
      status: 'done',
      finished_at: new Date().toISOString(),
      duration_ms: duration,
      report_id: reportId,
    });

    return NextResponse.json(report);
  } catch (err: any) {
    const isSecurityError = err?.message?.includes('SSRF') || err?.message?.includes('prohibited');
    const duration = Date.now() - startTime;

    if (createdJobId) {
      db.updateJob(createdJobId, {
        status: 'failed',
        finished_at: new Date().toISOString(),
        duration_ms: duration,
        error: err?.message || 'Audit execution error',
      });
    }

    return NextResponse.json(
      { error: err?.message || 'Audit execution failed' },
      { status: isSecurityError ? 400 : 500 }
    );
  }
}
