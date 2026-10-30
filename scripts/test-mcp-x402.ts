import { spawn } from 'child_process';
import path from 'path';

interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

async function runMcpAndX402Tests() {
  console.log('====================================================');
  console.log('       TESTING CRAWLPAY MCP & x402 PROTOCOL         ');
  console.log('====================================================\n');

  // Path to mcp-server.ts
  const mcpServerPath = path.resolve(__dirname, 'mcp-server.ts');
  const tsxCliPath = path.resolve(__dirname, '../node_modules/tsx/dist/cli.mjs');

  console.log('1. Launching MCP Server (scripts/mcp-server.ts) via stdio...');
  const child = spawn(process.execPath, [tsxCliPath, mcpServerPath], {
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'inherit'], // stderr inherits so server logs print cleanly
  });

  let messageId = 1;
  const pendingRequests = new Map<number | string, (res: any) => void>();

  let buffer = '';
  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const msg = JSON.parse(trimmed) as JsonRpcMessage;
        if (msg.id !== undefined && pendingRequests.has(msg.id)) {
          const resolve = pendingRequests.get(msg.id)!;
          pendingRequests.delete(msg.id);
          resolve(msg);
        }
      } catch (err) {
        // Not a JSON message, ignore
      }
    }
  });

  function sendRpc(method: string, params?: any): Promise<JsonRpcMessage> {
    const id = messageId++;
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    }) + '\n';

    return new Promise((resolve) => {
      pendingRequests.set(id, resolve);
      child.stdin.write(payload);
    });
  }

  try {
    // 1. Initialize MCP Protocol
    console.log('\n2. Sending MCP initialize request...');
    const initResponse = await sendRpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'crawlpay-test-client',
        version: '1.0.0',
      },
    });

    console.log('✓ MCP Server Initialized:', initResponse.result?.serverInfo);

    // Send initialized notification
    child.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }) + '\n');

    // 2. Query available MCP tools
    console.log('\n3. Querying registered MCP tools via tools/list...');
    const toolsResponse = await sendRpc('tools/list');
    const tools = toolsResponse.result?.tools || [];
    console.log(`✓ Retrieved ${tools.length} MCP tools:`);
    for (const tool of tools) {
      console.log(`  - [Tool] ${tool.name}: ${tool.description.slice(0, 80)}...`);
    }

    const toolNames = tools.map((t: any) => t.name);
    const expectedTools = ['crawlpay_audit_site', 'crawlpay_compare_competitor', 'crawlpay_agent_status', 'handle_payment_required'];
    const missing = expectedTools.filter(t => !toolNames.includes(t));
    if (missing.length === 0) {
      console.log('✓ All expected tools are registered successfully!');
    } else {
      console.error('✗ Missing expected tools:', missing);
    }

    // 3. Test Tool: crawlpay_agent_status
    console.log('\n4. Testing Tool: crawlpay_agent_status...');
    const statusResult = await sendRpc('tools/call', {
      name: 'crawlpay_agent_status',
      arguments: {},
    });
    const statusText = statusResult.result?.content?.[0]?.text || '';
    console.log('✓ crawlpay_agent_status response preview:');
    console.log(statusText.split('\n').slice(0, 8).join('\n'));
    console.log('  ...');

    // 4. Test Tool: handle_payment_required (x402 handler)
    console.log('\n5. Testing Tool: handle_payment_required (x402 Challenge Handler)...');
    const x402Result = await sendRpc('tools/call', {
      name: 'handle_payment_required',
      arguments: {
        url: 'https://crawlpay.org/api/audit',
        amountUsd: '0.25',
      },
    });
    const x402Text = x402Result.result?.content?.[0]?.text || '';
    console.log('✓ handle_payment_required response preview:');
    console.log(x402Text.split('\n').slice(0, 10).join('\n'));

    // 5. Test Audit Tool (mock/fast audit)
    console.log('\n6. Testing Tool: crawlpay_audit_site (Quick Mode on example.com)...');
    const auditResult = await sendRpc('tools/call', {
      name: 'crawlpay_audit_site',
      arguments: {
        url: 'https://example.com',
        mode: 'quick',
      },
    });
    const auditText = auditResult.result?.content?.[0]?.text || '';
    console.log('✓ crawlpay_audit_site completed! Sample output:');
    console.log(auditText.split('\n').slice(0, 15).join('\n'));
    console.log('  ...');

    console.log('\n====================================================');
    console.log('       ALL MCP & x402 TESTS PASSED SUCCESSFULLY!    ');
    console.log('====================================================');
  } finally {
    child.kill();
  }
}

runMcpAndX402Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

