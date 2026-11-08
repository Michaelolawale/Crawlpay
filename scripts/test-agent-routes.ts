import { GET as getAgentCard } from '../src/app/.well-known/agent-card.json/route';
import { GET as getBazaar } from '../src/app/api/x402-bazaar/route';
import { GET as getRegistration } from '../src/app/api/agent-registration/route';
import { GET as getAgentStatus } from '../src/app/api/agent/status/route';
import { GET as getStatus } from '../src/app/api/status/route';
import { POST as postAudit } from '../src/app/api/audit/route';
import { NextRequest } from 'next/server';

function createMockRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as any);
}

async function runAgentRouteTests() {
  console.log('========================================================');
  console.log('       CRAWLPAY AGENT ROUTE & SPEC VALIDATION SUITE     ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✔ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Test /.well-known/agent-card.json
  console.log('[1] Testing Agent Card Discovery Manifest (/.well-known/agent-card.json)...');
  const cardReq = createMockRequest('http://localhost:3000/.well-known/agent-card.json');
  const cardRes = await getAgentCard(cardReq);
  const cardData = await cardRes.json();
  assert(cardRes.status === 200, 'Agent Card returns HTTP 200');
  assert(cardData.schemaVersion === '2.0.0', `Schema version is 2.0.0 (got ${cardData.schemaVersion})`);
  assert(cardData.capabilities?.x402 === true, 'Advertises x402 capability');
  assert(cardData.capabilities?.mcp === true, 'Advertises MCP capability');
  assert(cardData.capabilities?.a2a === true, 'Advertises A2A capability');
  assert(Array.isArray(cardData.skills) && cardData.skills.length === 5, `Advertises 5 skills (got ${cardData.skills?.length})`);
  assert(cardData.payment?.attributionTag === 'celo_757c2ac3b70c', 'Attribution tag matches celo_757c2ac3b70c');
  assert(cardData.payment?.payTo?.toLowerCase() === '0xf06c2b754d07cba299751f0985a48f8013bb6b39', 'Recipient matches agent wallet');

  // 2. Test /api/x402-bazaar
  console.log('\n[2] Testing x402 Bazaar Catalog (/api/x402-bazaar)...');
  const bazaarRes = await getBazaar();
  const bazaarData = await bazaarRes.json();
  assert(bazaarRes.status === 402, 'Bazaar returns HTTP 402 challenge per spec');
  assert(bazaarRes.headers.get('WWW-Authenticate') === 'x402', 'Contains WWW-Authenticate: x402 header');
  assert(bazaarData.bazaar?.version === '2.0.0', `Bazaar version is 2.0.0 (got ${bazaarData.bazaar?.version})`);
  assert(bazaarData.pricing?.quickAuditUsd !== undefined, 'Includes quick audit pricing');
  assert(bazaarData.pricing?.fullAuditUsd !== undefined, 'Includes full deep audit pricing');
  assert(bazaarData.attributionTag === 'celo_757c2ac3b70c', 'Includes attribution tag in bazaar response');

  // 3. Test /api/agent-registration
  console.log('\n[3] Testing ERC-8004 Agent Registration Document (/api/agent-registration)...');
  const regReq = createMockRequest('http://localhost:3000/api/agent-registration');
  const regRes = await getRegistration(regReq);
  const regData = await regRes.json();
  assert(regRes.status === 200, 'Registration doc returns HTTP 200');
  assert(regData.type?.includes('eip-8004'), 'Complies with EIP-8004 registration type');
  assert(Array.isArray(regData.services) && regData.services.length >= 4, `Registers services array (got ${regData.services?.length})`);
  assert(regData.celo?.attributionTag === 'celo_757c2ac3b70c', 'Matches Celo attribution tag');
  assert(regData.celo?.identityRegistry?.toLowerCase() === '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432', 'Matches ERC-8004 registry address');

  // 4. Test /api/agent/status
  console.log('\n[4] Testing Live Agent Status Telemetry (/api/agent/status)...');
  const statusReq = createMockRequest('http://localhost:3000/api/agent/status');
  const statusRes = await getAgentStatus(statusReq);
  const statusData = await statusRes.json();
  assert(statusRes.status === 200, 'Agent status returns HTTP 200');
  assert(statusData.agentVersion === '2.0.0', 'Returns agentVersion 2.0.0');
  assert(statusData.agentWallet?.toLowerCase() === '0xf06c2b754d07cba299751f0985a48f8013bb6b39', 'Returns verified agent wallet address');
  assert(statusData.attributionTag === 'celo_757c2ac3b70c', 'Returns verified attribution tag');
  assert(Array.isArray(statusData.capabilities) && statusData.capabilities.length >= 5, 'Returns capabilities array');

  // 5. Test /api/status
  console.log('\n[5] Testing System Status (/api/status)...');
  const sysRes = await getStatus();
  const sysData = await sysRes.json();
  assert(sysRes.status === 200, 'System status returns HTTP 200');
  assert(sysData.version === '2.0.0', 'System status returns version 2.0.0');
  assert(sysData.endpoints?.agentCard !== undefined, 'Links to agentCard endpoint');
  assert(sysData.endpoints?.agentRegistration !== undefined, 'Links to agentRegistration endpoint');

  // 6. Test /api/audit x402 enforcement
  console.log('\n[6] Testing x402 Payment Enforcement (/api/audit)...');
  const auditBadReq = createMockRequest('http://localhost:3000/api/audit', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const auditBadRes = await postAudit(auditBadReq);
  assert(auditBadRes.status === 400, 'Missing URL returns HTTP 400 Bad Request');

  const auditFullUnpaidReq = createMockRequest('http://localhost:3000/api/audit', {
    method: 'POST',
    body: JSON.stringify({ url: 'https://example.com', mode: 'full' }),
  });
  const auditFullUnpaidRes = await postAudit(auditFullUnpaidReq);
  assert(auditFullUnpaidRes.status === 402, 'Unpaid full deep audit returns HTTP 402 Payment Required');
  assert(auditFullUnpaidRes.headers.get('WWW-Authenticate') === 'x402', 'Contains WWW-Authenticate: x402 header');
  const auditFullData = await auditFullUnpaidRes.json();
  assert(auditFullData.attributionTag === 'celo_757c2ac3b70c', 'x402 challenge includes attribution tag');
  assert(auditFullData.payTo?.toLowerCase() === '0xf06c2b754d07cba299751f0985a48f8013bb6b39', 'x402 challenge includes agent recipient');

  console.log('\n========================================================');
  console.log(`TOTAL AGENT TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('========================================================');

  if (failed > 0) process.exit(1);
}

runAgentRouteTests().catch((err) => {
  console.error('Test runner failure:', err);
  process.exit(1);
});

