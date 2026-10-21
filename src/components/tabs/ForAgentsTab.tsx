'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Copy,
  Check,
  Terminal,
  FileCode,
  ShieldCheck,
  ExternalLink,
  Code2,
  Share2,
} from 'lucide-react';
import { CONFIG } from '@/config';

export function ForAgentsTab() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pythonSnippet = `import requests

# 10-line CrawlPay x402 Client
payload = {"url": "https://example.com", "mode": "quick"}
headers = {"Authorization": "x402 target=celo; recipient=${CONFIG.AGENT_WALLET_ADDRESS}"}
res = requests.post("https://crawlpay.io/api/audit", json=payload, headers=headers)
data = res.json()

print(f"Crawled {data['pagesChecked']} page(s) | Status: {res.status_code}")
for group in data.get("prioritizedGroups", []):
    print(f"[{group['severity'].upper()}] {group['checkId']} -> {group['stackFix']}")`;

  const tsSnippet = `// 10-line TypeScript Autonomous Agent Client
const res = await fetch("https://crawlpay.io/api/audit", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "x402 celo_${CONFIG.ATTRIBUTION_TAG}",
  },
  body: JSON.stringify({ url: "https://example.com", mode: "quick" }),
});
const audit = await res.json();
console.log(\`Detected \${audit.prioritizedGroups.length} root cause issue groups.\`);`;

  const mcpConfig = `{
  "mcpServers": {
    "crawlpay": {
      "command": "npx",
      "args": ["-y", "@crawlpay/mcp-server"],
      "env": {
        "CRAWLPAY_AGENT_URL": "https://crawlpay.io/api",
        "CELO_PAYTO_ADDRESS": "${CONFIG.AGENT_WALLET_ADDRESS}",
        "CELO_ATTRIBUTION_TAG": "${CONFIG.ATTRIBUTION_TAG}",
        "ERC8004_REGISTRY": "${CONFIG.ERC8004_REGISTRY}"
      }
    }
  }
}`;

  const requestSchema = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CrawlPayAuditRequest",
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Target website URL to audit"
    },
    "mode": {
      "type": "string",
      "enum": ["quick", "full"],
      "default": "quick",
      "description": "quick (1 page, $0.25) or full (up to 50 pages, $0.50)"
    },
    "paymentProof": {
      "type": "string",
      "description": "Optional x402 transaction hash or token"
    }
  },
  "required": ["url"]
}`;

  const responseSchema = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CrawlPayAuditResponse",
  "type": "object",
  "properties": {
    "targetUrl": { "type": "string" },
    "pagesChecked": { "type": "number" },
    "prioritizedGroups": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "checkId": { "type": "string" },
          "rootCauseKey": { "type": "string" },
          "severity": { "type": "string", "enum": ["critical", "high", "medium", "low", "info"] },
          "priority": { "type": "number" },
          "affectedCount": { "type": "number" },
          "stackFix": { "type": "string" },
          "evidence": {
            "type": "object",
            "properties": {
              "observed": { "type": "string" },
              "expected": { "type": "string" },
              "snippet": { "type": "string" }
            }
          }
        }
      }
    },
    "whatPassed": { "type": "string" },
    "notChecked": { "type": "array", "items": { "type": "string" } },
    "codePatches": {
      "type": "object",
      "properties": {
        "htmlHeadBlock": { "type": "string" },
        "nextJsMetadata": { "type": "string" },
        "shopifyLiquid": { "type": "string" },
        "schemaJsonLd": { "type": "string" }
      }
    }
  }
}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <Cpu className="size-3.5" />
          <span>Machine-to-Machine x402 Settlement</span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Agent & Developer Integration
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Everything AI agents and developers need to consume CrawlPay programmatically over Celo HTTP 402 rails.
        </p>
      </div>

      {/* Identity & Payment Registry */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <span>Onchain Identity & Payment Registry</span>
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          {/* ERC-8004 Identity */}
          <div className="rounded-lg border border-border bg-background p-3.5 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              ERC-8004 Agent Identity
            </span>
            <div className="flex items-center justify-between font-mono">
              <span className="truncate mr-2 text-foreground">{CONFIG.ERC8004_REGISTRY}</span>
              <button
                type="button"
                onClick={() => copy(CONFIG.ERC8004_REGISTRY, 'erc8004')}
                className="text-primary hover:underline shrink-0"
              >
                {copiedKey === 'erc8004' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <a
              href="https://8004scan.io/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline pt-1"
            >
              <span>View on 8004scan.io</span>
              <ExternalLink className="size-3" />
            </a>
          </div>

          {/* PayTo Address */}
          <div className="rounded-lg border border-border bg-background p-3.5 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Agent PayTo Address (Celo Mainnet)
            </span>
            <div className="flex items-center justify-between font-mono">
              <span className="truncate mr-2 text-foreground">{CONFIG.AGENT_WALLET_ADDRESS}</span>
              <button
                type="button"
                onClick={() => copy(CONFIG.AGENT_WALLET_ADDRESS, 'payto')}
                className="text-primary hover:underline shrink-0"
              >
                {copiedKey === 'payto' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <a
              href={`https://celoscan.io/address/${CONFIG.AGENT_WALLET_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline pt-1"
            >
              <span>View on Celoscan</span>
              <ExternalLink className="size-3" />
            </a>
          </div>

          {/* Attribution Tag */}
          <div className="rounded-lg border border-border bg-background p-3.5 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Celo Attribution Tag (ERC-8021)
            </span>
            <div className="flex items-center justify-between font-mono">
              <span className="text-primary font-bold">{CONFIG.ATTRIBUTION_TAG}</span>
              <button
                type="button"
                onClick={() => copy(CONFIG.ATTRIBUTION_TAG, 'tag')}
                className="text-primary hover:underline shrink-0"
              >
                {copiedKey === 'tag' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Required in transaction calldata to receive hackathon onchain attribution credit.
            </span>
          </div>

          {/* Suffix */}
          <div className="rounded-lg border border-border bg-background p-3.5 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              ERC-8021 Calldata Suffix
            </span>
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="truncate mr-2 text-muted-foreground">{CONFIG.DATA_SUFFIX}</span>
              <button
                type="button"
                onClick={() => copy(CONFIG.DATA_SUFFIX, 'suffix')}
                className="text-primary hover:underline shrink-0"
              >
                {copiedKey === 'suffix' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Append to transaction calldata when calling without Viem extension.
            </span>
          </div>
        </div>
      </section>

      {/* Endpoints Table */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Share2 className="size-4 text-primary" />
          <span>Available API Endpoints</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3">Method & Path</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">Auth / Rail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              <tr>
                <td className="py-3 px-3 text-primary font-bold">POST /api/audit</td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  Deterministic technical audit, root causes & stack fixes
                </td>
                <td className="py-3 px-3 text-foreground">$0.25 / $0.50 USD₮</td>
                <td className="py-3 px-3 text-muted-foreground">x402 / Web3</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-primary font-bold">POST /api/compare</td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  Head-to-head competitor SEO gap analysis
                </td>
                <td className="py-3 px-3 text-foreground">$0.50 USD₮</td>
                <td className="py-3 px-3 text-muted-foreground">x402 / Web3</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-primary font-bold">GET /api/agent-registration</td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  ERC-8004 agent identity manifest & endpoint catalog
                </td>
                <td className="py-3 px-3 text-emerald-400">Free</td>
                <td className="py-3 px-3 text-muted-foreground">Public</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-primary font-bold">GET /.well-known/agent-card.json</td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  A2A (Agent-to-Agent) protocol discovery specification
                </td>
                <td className="py-3 px-3 text-emerald-400">Free</td>
                <td className="py-3 px-3 text-muted-foreground">Public</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-primary font-bold">GET /api/x402-bazaar</td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  OpenAPI discovery catalog (Returns 402 with agent specs)
                </td>
                <td className="py-3 px-3 text-emerald-400">Free</td>
                <td className="py-3 px-3 text-muted-foreground">Public</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-primary font-bold">GET /api/agent/status</td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  Real-time Celo Mainnet balances, gas price, block & ERC-8004 status
                </td>
                <td className="py-3 px-3 text-emerald-400">Free</td>
                <td className="py-3 px-3 text-muted-foreground">Public</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-primary font-bold">POST /api/payment/verify</td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  Verify transaction hash, receipt & ERC-8021 attribution on Celo
                </td>
                <td className="py-3 px-3 text-emerald-400">Free</td>
                <td className="py-3 px-3 text-muted-foreground">Public</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-primary font-bold">POST /api/agent/broadcast</td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  Autonomous agent hotwallet attributed transaction broadcaster
                </td>
                <td className="py-3 px-3 text-muted-foreground">Gas (CELO)</td>
                <td className="py-3 px-3 text-muted-foreground">Attributed</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-primary font-bold">POST /api/agent/register</td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  Mint & register ERC-8004 NFT on Celo Identity Registry
                </td>
                <td className="py-3 px-3 text-muted-foreground">Gas (CELO)</td>
                <td className="py-3 px-3 text-muted-foreground">Attributed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 10-Line Client Example */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Terminal className="size-4 text-primary" />
            <span>10-Line Autonomous Client Example</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copy(pythonSnippet, 'python')}
              className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedKey === 'python' ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
              <span>Copy Python</span>
            </button>
            <button
              type="button"
              onClick={() => copy(tsSnippet, 'ts')}
              className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedKey === 'ts' ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
              <span>Copy TS</span>
            </button>
          </div>
        </div>

        <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 font-mono text-xs text-primary/90">
          {pythonSnippet}
        </pre>
      </section>

      {/* MCP Configuration */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileCode className="size-4 text-primary" />
              <span>Model Context Protocol (MCP) Config</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add CrawlPay as a native tool in Claude Desktop, Antigravity, or Cursor.
            </p>
          </div>
          <button
            type="button"
            onClick={() => copy(mcpConfig, 'mcp')}
            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copiedKey === 'mcp' ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
            <span>Copy mcp_config.json</span>
          </button>
        </div>

        <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 font-mono text-xs text-foreground/90">
          {mcpConfig}
        </pre>
      </section>

      {/* Request & Response Schemas */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Code2 className="size-3.5 text-primary" />
              <span>Request JSON Schema</span>
            </span>
            <button
              type="button"
              onClick={() => copy(requestSchema, 'req-schema')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedKey === 'req-schema' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="max-h-64 overflow-y-auto rounded bg-black/40 p-3 font-mono text-[11px] text-muted-foreground">
            {requestSchema}
          </pre>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Code2 className="size-3.5 text-primary" />
              <span>Response JSON Schema</span>
            </span>
            <button
              type="button"
              onClick={() => copy(responseSchema, 'res-schema')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedKey === 'res-schema' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="max-h-64 overflow-y-auto rounded bg-black/40 p-3 font-mono text-[11px] text-muted-foreground">
            {responseSchema}
          </pre>
        </div>
      </section>
    </div>
  );
}
