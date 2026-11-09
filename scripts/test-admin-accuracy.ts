/**
 * Test Suite: Admin Dashboard Data Accuracy & Single Source of Truth Verification
 * Validates:
 * 1. USDT (6 decimals) customer payment is parsed and credited as $0.50 USD revenue.
 * 2. Native CELO gas transfers (18 decimals) are NEVER added to USD customer revenue.
 * 3. Token decimal utilities prevent precision drift or arbitrary conversions.
 * 4. Sandbox/test data is quarantined from production KPIs.
 * 5. Overview totals equal the sum of their individual components (reconciliation test).
 * 6. Address and transaction hash masking prevents exposure of full hashes in summaries.
 */

import { parseRawTokenUnits, formatUsd, formatTokenAmount, maskAddress, maskTxHash } from '../src/utils/currency';
import { adminService } from '../src/services/adminService';
import { db, PaymentRecord } from '../src/services/db';

async function runTests() {
  console.log('--- STARTING ADMIN ACCURACY & INTEGRITY TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // TEST 1: Currency & Decimals Utility
  console.log('\n[Test 1] Currency & Decimal Precision Validation');
  // 6 decimals USDT: 500,000 raw units = 0.50 USDT
  const parsedUsdt = parseRawTokenUnits('500000', 6);
  assert(parsedUsdt === 0.5, `500,000 raw USDT (6 dec) should be exactly 0.5, got: ${parsedUsdt}`);

  // 18 decimals CELO: 3,300,000,000,000,000,000 raw units = 3.30 CELO
  const parsedCelo = parseRawTokenUnits('3300000000000000000', 18);
  assert(parsedCelo === 3.3, `3.3e18 raw CELO (18 dec) should be exactly 3.3, got: ${parsedCelo}`);

  // Format USD
  assert(formatUsd(0.5) === '$0.50', `formatUsd(0.5) should be '$0.50', got: ${formatUsd(0.5)}`);
  assert(formatUsd(0) === '$0.00', `formatUsd(0) should be '$0.00', got: ${formatUsd(0)}`);

  // Masking
  assert(maskAddress('0xf06c2b754d07cba299751f0985a48f8013bb6b39') === '0xf06c...6b39', 'Address masking works');
  assert(maskTxHash('0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5') === '0x3fc840...a062f5', 'Tx hash masking works');

  // TEST 2: Single Source of Truth Isolation in AdminService
  console.log('\n[Test 2] Revenue Calculation & CELO Gas Segregation');

  // Create production test records (not marked is_test and not having 'test' in id)
  const prodGasPayment: PaymentRecord = {
    id: 'pay_prod_gas_refuel_1',
    wallet: '0x788264b936c4669b862939af02642d93deaa6919',
    amount: '3.30',
    token: 'CELO',
    chain_id: 42220,
    tx_hash: '0xf7be5187eb98609777f14927972f152b623988fecd0bc9c2d05bcae2194daac8',
    status: 'confirmed',
    is_test: false,
    type: 'gas_refuel',
    created_at: new Date().toISOString(),
  };

  const prodCustomerPayment: PaymentRecord = {
    id: 'pay_prod_customer_usdt_1',
    wallet: '0x1234567890123456789012345678901234567890',
    amount: '0.50',
    token: 'USDT',
    chain_id: 42220,
    tx_hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    status: 'confirmed',
    is_test: false,
    type: 'customer_payment',
    created_at: new Date().toISOString(),
  };

  await db.addPayment(prodGasPayment);
  await db.addPayment(prodCustomerPayment);

  const prodOverview = await adminService.getOverview(false);
  const allOverview = await adminService.getOverview(true);

  console.log(`  Production Revenue USD: $${prodOverview.metrics.revenueUsd}`);
  console.log(`  Production Customer Payments: ${prodOverview.metrics.customerPaymentsCount}`);
  console.log(`  Production Operator Gas Refuels: ${prodOverview.metrics.gasRefuelsCelo} CELO (${prodOverview.metrics.gasRefuelsCount} events)`);

  assert(
    prodOverview.metrics.revenueUsd === '0.50',
    `Production revenue should be exactly $0.50 (USDT customer payment only), got: $${prodOverview.metrics.revenueUsd}`
  );
  assert(
    prodOverview.metrics.customerPaymentsCount === 1,
    `Production customer payment count should be 1, got: ${prodOverview.metrics.customerPaymentsCount}`
  );
  assert(
    Number(prodOverview.metrics.gasRefuelsCelo) >= 3.3,
    `Production gas refuels should record the CELO transfer amount without adding to USD revenue`
  );

  // TEST 3: Sandbox / Test Quarantine
  console.log('\n[Test 3] Sandbox Data Quarantine Verification');
  // Seeded record pay_init_1 is marked is_test: true
  // In prodOverview (includeTest: false), it must NOT be included
  // In allOverview (includeTest: true), it is included (+0.50)
  console.log(`  Sandbox Included Revenue USD: $${allOverview.metrics.revenueUsd}`);
  assert(
    allOverview.metrics.revenueUsdRaw > prodOverview.metrics.revenueUsdRaw,
    `All overview includes sandbox revenue ($${allOverview.metrics.revenueUsd}) while prod overview excludes it ($${prodOverview.metrics.revenueUsd})`
  );

  // TEST 4: Reconciliation (Totals equal sum of items)
  console.log('\n[Test 4] Reconciliation: Overview Totals vs List of Payments');
  const paymentsResponse = await adminService.getPayments(false);
  const sumOfCustomerPayments = paymentsResponse.payments
    .filter((p) => p.isCustomerPayment)
    .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

  const sumOfGasRefuels = paymentsResponse.payments
    .filter((p) => p.isGasRefuel)
    .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

  assert(
    Math.abs(sumOfCustomerPayments - prodOverview.metrics.revenueUsdRaw) < 0.001,
    `Reconciliation check: sum of individual customer payment rows ($${sumOfCustomerPayments.toFixed(2)}) matches overview total ($${prodOverview.metrics.revenueUsd})`
  );

  assert(
    Math.abs(sumOfGasRefuels - parseFloat(prodOverview.metrics.gasRefuelsCelo)) < 0.001,
    `Reconciliation check: sum of individual gas refuel rows (${sumOfGasRefuels.toFixed(4)} CELO) matches overview total (${prodOverview.metrics.gasRefuelsCelo} CELO)`
  );

  // TEST 5: Admin Security & Passkey / IP Allowlist Enforcement
  console.log('\n[Test 5] Operator Security & Passkey Verification');
  const { isAllowedAdminIp, verifyAdminAuth, extractClientIp, checkAdminRateLimit, recordFailedAdminLogin, recordSuccessfulAdminLogin } = await import('../src/utils/adminAuth');
  const { NextRequest } = await import('next/server');

  // Verify IP normalization (stripping IPv6 mapped IPv4 and ports)
  const reqWithMappedIp = new NextRequest('http://localhost:3000/api/admin/overview', {
    headers: { 'x-forwarded-for': '::ffff:105.113.80.135:49152, 127.0.0.1' },
  });
  const normalizedIp = extractClientIp(reqWithMappedIp);
  assert(normalizedIp === '105.113.80.135', `extractClientIp normalizes ::ffff:105.113.80.135:49152 to 105.113.80.135, got: ${normalizedIp}`);

  // When ADMIN_ENFORCE_IP is false, access allowed from any IP
  process.env.ADMIN_ENFORCE_IP = 'false';
  assert(isAllowedAdminIp(reqWithMappedIp) === true, 'When ADMIN_ENFORCE_IP=false, all IPs pass allowlist check');

  // When ADMIN_ENFORCE_IP is true
  process.env.ADMIN_ENFORCE_IP = 'true';
  process.env.ADMIN_ALLOWED_IPS = '127.0.0.1,105.113.80.135';
  assert(isAllowedAdminIp(reqWithMappedIp) === true, 'When ADMIN_ENFORCE_IP=true, allowed IP 105.113.80.135 passes');

  const rogueReq = new NextRequest('http://localhost:3000/api/admin/overview', {
    headers: { 'x-forwarded-for': '198.51.100.23' },
  });
  assert(isAllowedAdminIp(rogueReq) === false, 'When ADMIN_ENFORCE_IP=true, unauthorized IP 198.51.100.23 is blocked');

  // Verify Admin Key / Password authentication
  const originalKey = process.env.ADMIN_KEY;
  process.env.ADMIN_KEY = 'test_operator_secret_passkey_123';
  process.env.ADMIN_ENFORCE_IP = 'false';

  const validAuthReq = new NextRequest('http://localhost:3000/api/admin/overview', {
    headers: { authorization: 'Bearer test_operator_secret_passkey_123' },
  });
  assert(verifyAdminAuth(validAuthReq) === true, 'verifyAdminAuth accepts valid operator passkey');

  const invalidAuthReq = new NextRequest('http://localhost:3000/api/admin/overview', {
    headers: { authorization: 'Bearer wrong_password' },
  });
  assert(verifyAdminAuth(invalidAuthReq) === false, 'verifyAdminAuth rejects incorrect passkey');

  const missingAuthReq = new NextRequest('http://localhost:3000/api/admin/overview');
  assert(verifyAdminAuth(missingAuthReq) === false, 'verifyAdminAuth rejects missing Authorization header');

  // Rate limiting test
  const testIp = '192.0.2.99';
  recordSuccessfulAdminLogin(testIp);
  for (let i = 0; i < 4; i++) recordFailedAdminLogin(testIp);
  assert(checkAdminRateLimit(testIp).allowed === true, 'Rate limit permits under 5 failed attempts');
  recordFailedAdminLogin(testIp);
  assert(checkAdminRateLimit(testIp).allowed === false, 'Rate limit locks out after 5 consecutive failed attempts');
  recordSuccessfulAdminLogin(testIp);
  assert(checkAdminRateLimit(testIp).allowed === true, 'Successful login resets rate limit counter');

  // Restore env
  process.env.ADMIN_KEY = originalKey;
  process.env.ADMIN_ENFORCE_IP = 'false';

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
