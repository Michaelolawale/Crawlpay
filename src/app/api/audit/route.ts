import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config';
import { runAuditPipeline } from '@/services/auditRunner';
import { db } from '@/services/db';
import { auditRateLimiter } from '@/utils/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s max execution for deep crawler on serverless

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let createdJobId: string | undefined;
  let isVerifiedPaid = false;
  let crawlMode: 'quick' | 'full' = 'quick';

  try {
    // 1. Rate Limiting and Blocklist checks (trusted reverse proxy headers prioritized over raw X-Forwarded-For)
    const cfIp = req.headers.get('cf-connecting-ip');
    const realIp = req.headers.get('x-real-ip');
    const forwarded = req.headers.get('x-forwarded-for');
    let ip = (cfIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1')).trim();
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);

    if (await db.isBlocklisted('ip', ip)) {
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

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'Missing or invalid target URL' }, { status: 400 });
    }

    // Check domain blocklist
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (await db.isBlocklisted('domain', parsed.hostname)) {
        return NextResponse.json(
          { error: `Access denied: Domain '${parsed.hostname}' is blocklisted.` },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Malformed target URL format' }, { status: 400 });
    }

    // Check wallet blocklist
    if (wallet && (await db.isBlocklisted('wallet', wallet))) {
      return NextResponse.json(
        { error: 'Access denied: Wallet address is blocklisted.' },
        { status: 403 }
      );
    }

    const dynamicConfig = await db.getConfig();

    // Enforce dynamic rate limit per minute
    if (!db.checkRateLimit(ip, dynamicConfig.rate_limit_per_minute)) {
      return NextResponse.json(
        { error: `Rate limit exceeded: maximum ${dynamicConfig.rate_limit_per_minute} requests per minute.` },
        { status: 429 }
      );
    }

    // 2. Check for x402 Payment Headers or Body proof
    const authHeader = req.headers.get('authorization') || req.headers.get('x-payment') || '';
    let rawTx = typeof paymentProof === 'string' ? paymentProof.trim() : undefined;
    if (!rawTx && authHeader) {
      const match = authHeader.match(/0x[a-fA-F0-9]{64}/);
      if (match) rawTx = match[0];
    }
    const incomingTxHash = rawTx && /^0x[a-fA-F0-9]{64}$/.test(rawTx) ? rawTx : undefined;

    isVerifiedPaid = false;
    let verifiedPaymentInfo: any = null;
    let paymentId: string | undefined;

    crawlMode = mode === 'full' ? 'full' : 'quick';
    const targetPriceUsd = crawlMode === 'full' ? dynamicConfig.full_price_usd : dynamicConfig.quick_price_usd;

    let isSandboxSimulation = false;

    if (incomingTxHash) {
      // Replay prevention & idempotent retry support
      const existingPayment = await db.getPaymentByTxHash(incomingTxHash);
      if (existingPayment) {
        // Security check: Never accept operational gas refuels or agent pings as customer audit payment
        const isGasOrPing = existingPayment.type === 'gas_refuel' || existingPayment.type === 'agent_sponsored' || existingPayment.type === 'ping' || (existingPayment.token === 'CELO' && existingPayment.type !== 'customer_payment');
        if (isGasOrPing) {
          return NextResponse.json(
            { error: 'Invalid payment proof: Specified transaction was an operational gas transfer, not a customer audit settlement.' },
            { status: 402 }
          );
        }

        // Check if there is already a completed report for this exact payment and URL (idempotency)
        const allJobs = await db.listJobs();
        const completedJob = allJobs.find(
          (j) => j.payment_id === existingPayment.id && j.status === 'done' && j.report_id
        );

        if (completedJob && completedJob.report_id) {
          const existingReport = await db.getReport(completedJob.report_id);
          if (existingReport) {
            return NextResponse.json(existingReport);
          }
        }

        // Previous job failed, timed out, or is being executed — allow with existing payment!
        isVerifiedPaid = true;
        paymentId = existingPayment.id;
      } else {
        const { identityService } = await import('@/services/identityService');
        const verification = await identityService.verifyPaymentTx(incomingTxHash);
        if (verification.valid && verification.mined) {
          const isUsdt = verification.token === 'USDT' || Boolean(verification.valueUsdt);
          const isCelo = !isUsdt && Boolean(verification.valueCelo && Number(verification.valueCelo) > 0);

          // Security check: Validate minimum payment amount for full audits
          const rawUsdt = parseFloat(verification.valueUsdt || '0');
          const rawCelo = parseFloat(verification.valueCelo || '0');
          const targetPriceNum = parseFloat(targetPriceUsd || '0.50');
          const targetCeloNum = parseFloat(CONFIG.CELO_PRICE_FULL || '6.6');

          const isUsdtSufficient = isUsdt && rawUsdt >= (targetPriceNum * 0.95);
          const isCeloSufficient = isCelo && rawCelo >= (targetCeloNum * 0.95);

          if (crawlMode === 'full' && !isUsdtSufficient && !isCeloSufficient) {
            return NextResponse.json(
              {
                error: `Payment amount insufficient: required $${targetPriceUsd} USDT (or ${CONFIG.CELO_PRICE_FULL} CELO), received ${isUsdt ? `$${rawUsdt.toFixed(2)} USDT` : `${rawCelo.toFixed(4)} CELO`}`,
              },
              { status: 402 }
            );
          }

          isVerifiedPaid = true;
          verifiedPaymentInfo = verification;

          // Log payment in database using dynamic pricing
          paymentId = `pay_${Date.now()}`;
          await db.addPayment({
            id: paymentId,
            wallet: verification.from || wallet || 'unknown',
            amount: isUsdt ? (verification.valueUsdt || targetPriceUsd) : (verification.valueCelo || CONFIG.CELO_PRICE_FULL),
            token: isUsdt ? 'USDT' : 'CELO',
            chain_id: CONFIG.CELO_CHAIN_ID,
            tx_hash: incomingTxHash,
            status: 'confirmed',
            type: 'customer_payment',
            is_test: false,
            created_at: new Date().toISOString(),
          });
        } else {
          return NextResponse.json(
            { error: `Payment verification failed: ${verification.error || 'Transaction not verified on Celo'}` },
            { status: 402 }
          );
        }
      }
    } else if (process.env.ENABLE_SANDBOX === 'true' && paymentProof === 'sandbox_simulator_proof') {
      // Internal developer sandbox only
      isVerifiedPaid = true;
      isSandboxSimulation = true;
    }

    // 3. Paid vs Free Quick Tier Policy:
    // Full deep crawl ALWAYS requires verified payment or machine x402
    const acceptHeader = req.headers.get('accept') || '';
    const isExplicitlyPaidRequest = requirePaid || acceptHeader.includes('application/x402+json') || crawlMode === 'full';

    if (isExplicitlyPaidRequest && !isVerifiedPaid) {
      return NextResponse.json(
        {
          status: 402,
          error: 'Payment Required for Deep Crawl',
          priceUsd: targetPriceUsd,
          currency: 'USDT',
          tokenAddress: CONFIG.CELO_USDT_ADDRESS,
          tokenDecimals: CONFIG.USDT_DECIMALS,
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
            'X-Accept-Payment': `USDT; amount=${targetPriceUsd}; network=celo; chainId=${CONFIG.CELO_CHAIN_ID}; recipient=${CONFIG.AGENT_WALLET_ADDRESS}; tokenAddress=${CONFIG.CELO_USDT_ADDRESS}; decimals=${CONFIG.USDT_DECIMALS}; attribution=${CONFIG.ATTRIBUTION_TAG}`,
          },
        }
      );
    }

    // 4. Rate Limiting for Free Quick Audits (Max 5/hr per IP, daily cap 20 + 10m domain cooldown)
    if (!isVerifiedPaid && crawlMode === 'quick') {
      const freeRateCheck = await db.checkFreeAuditLimit(ip, url, 5, 10, 20);
      if (!freeRateCheck.allowed) {
        return NextResponse.json(
          {
            error: freeRateCheck.message || 'Free quick audit limit reached.',
            code: freeRateCheck.code || 'RATE_LIMIT_EXCEEDED',
            limitType: freeRateCheck.limitType || 'hourly',
            retryAfterSec: freeRateCheck.retryAfterSec,
            remaining: 0,
            remainingHourly: freeRateCheck.remainingHourly ?? 0,
            remainingDaily: freeRateCheck.remainingDaily ?? 0,
            limit: 5,
            limitHourly: 5,
            limitDaily: 20,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(freeRateCheck.retryAfterSec || 3600),
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Limit-Daily': '20',
              'X-RateLimit-Remaining-Daily': String(freeRateCheck.remainingDaily ?? 0),
            },
          }
        );
      }

      // If domain was audited within cooldown and has a completed report, return cache directly
      if (freeRateCheck.cachedReportId) {
        const cachedReport = await db.getReport(freeRateCheck.cachedReportId);
        if (cachedReport) {
          return NextResponse.json(cachedReport, {
            headers: {
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': String(freeRateCheck.remainingHourly ?? 4),
              'X-RateLimit-Limit-Daily': '20',
              'X-RateLimit-Remaining-Daily': String(freeRateCheck.remainingDaily ?? 19),
            },
          });
        }
      }

      db.recordFreeAudit(ip);
    }

    // 5. Log job in database as running
    createdJobId = `job_${Date.now()}`;
    const effectiveWallet = verifiedPaymentInfo?.from || wallet || undefined;

    await db.addJob({
      id: createdJobId,
      payment_id: paymentId,
      url,
      depth: crawlMode,
      status: 'running',
      started_at: new Date().toISOString(),
      is_test: isSandboxSimulation,
      wallet: effectiveWallet,
      ip,
    });

    // 5. Execute audit pipeline with runtime dynamic configuration
    const report = await runAuditPipeline(url, crawlMode, isVerifiedPaid, dynamicConfig);
    const duration = Date.now() - startTime;
    const reportId = `rep_${Date.now()}`;

    if (verifiedPaymentInfo) {
      report.onchainReceipt.isRealBroadcast = true;
      report.onchainReceipt.upstreamBrowserReceipt.txHash = incomingTxHash!;
      report.onchainReceipt.upstreamBrowserReceipt.celoscanUrl = `https://celoscan.io/tx/${incomingTxHash}`;
      report.onchainReceipt.upstreamBrowserReceipt.isRealBroadcast = true;
    }

    // Record live transaction into the audit stream (agent-sponsored or customer settlement)
    const executionTxHash = report.onchainReceipt?.upstreamBrowserReceipt?.txHash || incomingTxHash;
    if (executionTxHash) {
      if (isVerifiedPaid && incomingTxHash) {
        await db.addPayment({
          id: `pay_crawl_${Date.now()}`,
          wallet: effectiveWallet || CONFIG.AGENT_WALLET_ADDRESS,
          amount: '0.50',
          token: 'USDT',
          chain_id: 42220,
          tx_hash: incomingTxHash,
          status: 'confirmed',
          type: 'customer_payment',
          is_test: isSandboxSimulation,
          created_at: new Date().toISOString(),
        }).catch(() => {});
      } else {
        await db.addPayment({
          id: `pay_sponsored_${Date.now()}`,
          wallet: effectiveWallet || CONFIG.AGENT_WALLET_ADDRESS,
          amount: '0.00',
          token: 'CELO',
          chain_id: 42220,
          tx_hash: executionTxHash,
          status: 'confirmed',
          type: 'agent_sponsored',
          is_test: isSandboxSimulation,
          created_at: new Date().toISOString(),
        }).catch(() => {});
      }
    }

    // Save report in persistent store
    await db.saveReport(reportId, report, {
      jobId: createdJobId,
      targetUrl: url,
      wallet: effectiveWallet,
      mode: crawlMode,
    });

    // Update job status to done
    await db.updateJob(createdJobId, {
      status: 'done',
      finished_at: new Date().toISOString(),
      duration_ms: duration,
      report_id: reportId,
    });

    return NextResponse.json(report);
  } catch (err: any) {
    if (!isVerifiedPaid && crawlMode === 'quick') {
      const forwarded = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      const cfIp = req.headers.get('cf-connecting-ip');
      const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || cfIp || '127.0.0.1';
      db.refundFreeAuditQuota(ip);
    }

    const isSecurityError = err?.message?.includes('SSRF') || err?.message?.includes('prohibited');
    const duration = Date.now() - startTime;

    if (createdJobId) {
      await db.updateJob(createdJobId, {
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

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfIp = req.headers.get('cf-connecting-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || cfIp || '127.0.0.1';

  const quota = await db.getFreeAuditQuota(ip, 5, 20);
  return NextResponse.json(quota, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-RateLimit-Limit': String(quota.limitHourly),
      'X-RateLimit-Remaining': String(quota.remainingHourly),
      'X-RateLimit-Limit-Daily': String(quota.limitDaily),
      'X-RateLimit-Remaining-Daily': String(quota.remainingDaily),
    },
  });
}
