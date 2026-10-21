async function runTests() {
  const baseUrl = 'http://localhost:3000';
  const results: Array<{ name: string; endpoint: string; method: string; status: number; ok: boolean; sampleResponse: string }> = [];

  console.log(`Starting automated API test suite against ${baseUrl}...\n`);

  async function test(name: string, endpoint: string, options?: RequestInit) {
    const method = options?.method || 'GET';
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, options);
      const text = await res.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
      const isExpected = res.status >= 200 && res.status < 500;
      const snippet = typeof parsed === 'object' ? JSON.stringify(parsed).slice(0, 150) + '...' : String(text).slice(0, 150);
      results.push({
        name,
        endpoint,
        method,
        status: res.status,
        ok: isExpected,
        sampleResponse: snippet
      });
      console.log(`[${res.status}] ${method} ${endpoint} - ${name}`);
    } catch (err: any) {
      results.push({
        name,
        endpoint,
        method,
        status: 0,
        ok: false,
        sampleResponse: err.message
      });
      console.error(`[FAIL] ${method} ${endpoint} - ${err.message}`);
    }
  }

  // 1. GET /api/status
  await test('Agent General Status', '/api/status');

  // 2. GET /api/x402-bazaar
  await test('x402 Discovery Bazaar Schema', '/api/x402-bazaar');

  // 3. GET /api/agent-registration
  await test('ERC-8004 Agent Registration Document', '/api/agent-registration');

  // 4. GET /api/agent/status
  await test('Celo Onchain Telemetry & Identity Status', '/api/agent/status');

  // 5. POST /api/audit (missing URL validation)
  await test('Audit Endpoint - Missing URL Validation (400)', '/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // 6. POST /api/audit (HTTP 402 Payment Challenge)
  await test('Audit Endpoint - HTTP 402 Challenge', '/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com', requirePaid: true })
  });

  // 7. POST /api/audit (Live Quick Audit execution)
  await test('Audit Endpoint - Live Quick Audit Run', '/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com', mode: 'quick' })
  });

  // 8. POST /api/compare (Missing param validation)
  await test('Compare Endpoint - Missing Param Validation (400)', '/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // 9. POST /api/compare (Live Competitor Comparison)
  await test('Compare Endpoint - Live Comparison Run', '/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl: 'https://example.com', competitorUrl: 'https://iana.org' })
  });

  // 10. POST /api/payment/verify (Missing param validation)
  await test('Payment Verify - Missing txHash (400)', '/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // 11. POST /api/payment/verify (Test tx hash format validation)
  await test('Payment Verify - Test Valid Tx Format', '/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' })
  });

  console.log('\n========================================');
  console.log('            TEST SUMMARY                ');
  console.log('========================================');
  for (const r of results) {
    console.log(`${r.ok ? '✓ PASS' : '✗ FAIL'} [${r.status}] ${r.method.padEnd(5)} ${r.endpoint.padEnd(25)} : ${r.name}`);
  }
}

runTests();
