'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCode,
  Terminal,
  Cpu,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Code2,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { CONFIG } from '@/config';

export default function DocsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-20" aria-hidden="true" />

      {/* Docs Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-90 shrink-0">
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <CrawlLogo className="size-4 sm:size-5" />
            </span>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight">
              crawl<span className="text-primary">pay</span>
            </span>
            <span className="hidden xs:inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase">
              Docs
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/example" className="text-muted-foreground hover:text-foreground transition-colors">
              Demo Preview
            </Link>
          </nav>

          {/* Actions & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/app/audit"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shrink-0 gap-1"
            >
              <span>Launch App</span>
              <ArrowRight className="size-3.5 hidden sm:inline" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex size-8 sm:size-9 items-center justify-center rounded-lg border border-border bg-card p-1 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-4 sm:size-5 text-primary" /> : <Menu className="size-4 sm:size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-border bg-card/95 backdrop-blur-xl px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-200 shadow-xl space-y-3">
            <nav className="flex flex-col space-y-1 text-sm font-medium">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/terms"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Terms & Refund Policy
              </Link>
              <Link
                href="/example"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                View Demo Preview
              </Link>
              <Link
                href="/app/audit"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-primary font-semibold hover:bg-primary/20 transition-colors mt-1"
              >
                <span>Audit Your Website</span>
                <ArrowRight className="size-4" />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Docs Content */}
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Intro Banner */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Cpu className="size-3.5" />
            <span>Developer & Agent Protocol Reference</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Agents, MCP & x402 Endpoint Reference
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Crawlpay provides autonomous AI agents, LLM pipelines, and automated tools with deterministic SEO analysis and competitive intelligence. Paid per crawl on Celo Mainnet with zero API keys, subscriptions, or custodial accounts.
          </p>
        </div>

        {/* Section 1: Endpoints */}
        <section className="space-y-6 border-t border-border pt-8">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Code2 className="size-5 text-primary" />
            <span>API Endpoints Reference</span>
          </h2>

          <div className="space-y-4">
            {/* POST /api/audit */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400">POST</span>
                  <span className="font-bold text-foreground">/api/audit</span>
                </div>
                <span className="text-xs text-primary font-mono font-semibold">$0.25 - $0.50 USDT</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Initiates a deterministic crawler audit. Returns 10 technical SEO checks, root cause finding groups, and copy-pasteable framework patches.
              </p>
              <div className="rounded-lg bg-background p-3 font-mono text-xs text-muted-foreground overflow-x-auto">
                <pre>{`// Request Body:
{
  "url": "https://example.com",
  "mode": "quick", // "quick" ($0.25) or "full" ($0.50)
  "paymentProof": "0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5"
}`}</pre>
              </div>
            </div>

            {/* GET /api/x402-bazaar */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 font-bold text-blue-400">GET</span>
                  <span className="font-bold text-foreground">/api/x402-bazaar</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">Free Catalog</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Agent-discoverable schema exposing services, prices, accepted payment tokens, and ERC-8004 identity status.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Payment Flow for Autonomous Agents */}
        <section className="space-y-6 border-t border-border pt-8">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            <span>x402 Payment Flow for Autonomous Agents</span>
          </h2>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-xs text-muted-foreground leading-relaxed">
              <li>
                <strong className="text-foreground">Initial Request:</strong> The agent sends a request with header <code className="rounded bg-muted px-1.5 py-0.5 text-primary">Accept: application/x402+json</code>.
              </li>
              <li>
                <strong className="text-foreground">HTTP 402 Handshake:</strong> If no payment proof is attached, Crawlpay responds with <code className="rounded bg-muted px-1.5 py-0.5 text-amber-400">402 Payment Required</code> containing the recipient address (<code className="font-mono text-foreground">{CONFIG.AGENT_WALLET_ADDRESS}</code>), amount (<code className="font-mono text-foreground">$0.25 USDT</code>), and the required attribution suffix.
              </li>
              <li>
                <strong className="text-foreground">Attributed Settlement:</strong> The agent broadcasts a transaction on Celo Mainnet appending the ERC-8021 calldata tag:
                <div className="mt-2 flex items-center justify-between rounded bg-background p-2 font-mono text-[11px] text-foreground border border-border">
                  <span className="truncate mr-2">{CONFIG.DATA_SUFFIX}</span>
                  <button
                    type="button"
                    onClick={() => copy(CONFIG.DATA_SUFFIX, 'suffix')}
                    className="text-primary hover:underline shrink-0"
                  >
                    {copiedKey === 'suffix' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </li>
              <li>
                <strong className="text-foreground">Fulfillment:</strong> The agent replays the request with header <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">Authorization: x402 &lt;tx_hash&gt;</code>. Crawlpay verifies the transaction on Celo and streams the deterministic audit result.
              </li>
            </ol>
          </div>
        </section>

        {/* Section 3: Agent Hotwallet Settle */}
        <section className="space-y-6 border-t border-border pt-8">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Terminal className="size-5 text-primary" />
            <span>Autonomous Agent Hotwallet Settlement</span>
          </h2>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Autonomous bots operating without a browser extension can execute settlements directly via an EVM hotwallet client using <code className="text-primary">viem</code> or <code className="text-primary">@celo/attribution-tags</code>.
            </p>

            <div className="rounded-lg bg-background p-4 font-mono text-xs text-muted-foreground overflow-x-auto">
              <pre>{`import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import { withAttribution } from '@celo/attribution-tags';

// Initialize agent wallet client
const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as \`0x\${string}\`);
const client = createWalletClient({
  account,
  chain: celo,
  transport: http('https://forno.celo.org')
});

// Broadcast attributed payment on Celo
const txHash = await client.sendTransaction({
  to: '${CONFIG.AGENT_WALLET_ADDRESS}',
  value: 0n, // Attributed micropayment
  data: '${CONFIG.DATA_SUFFIX}' // ERC-8021 suffix
});

console.log('Mined payment tx:', txHash);`}</pre>
            </div>
          </div>
        </section>

        {/* Section 4: MCP Setup */}
        <section className="space-y-6 border-t border-border pt-8">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            <span>Model Context Protocol (MCP) Setup</span>
          </h2>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add Crawlpay as an MCP tool inside Claude Desktop, Cursor, or your custom AI assistant by appending this block to your <code className="text-primary">claude_desktop_config.json</code>:
            </p>

            <div className="rounded-lg bg-background p-4 font-mono text-xs text-muted-foreground overflow-x-auto">
              <pre>{`{
  "mcpServers": {
    "crawlpay": {
      "command": "npx",
      "args": ["-y", "@crawlpay/mcp-server"],
      "env": {
        "CELO_RPC_URL": "https://forno.celo.org",
        "AGENT_WALLET_ADDRESS": "${CONFIG.AGENT_WALLET_ADDRESS}"
      }
    }
  }
}`}</pre>
            </div>
          </div>
        </section>

        {/* Section 5: Error Codes */}
        <section className="space-y-6 border-t border-border pt-8">
          <h2 className="font-display text-xl font-bold text-foreground">Error & Status Codes</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4 space-y-1">
              <span className="font-mono text-xs font-bold text-destructive">400 Bad Request</span>
              <p className="text-xs text-muted-foreground">
                Target URL failed SSRF validation (private network, loopback, or cloud metadata IP).
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-1">
              <span className="font-mono text-xs font-bold text-amber-400">402 Payment Required</span>
              <p className="text-xs text-muted-foreground">
                Audit requires payment settlement. Returns challenge parameters and Celo recipient.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-1">
              <span className="font-mono text-xs font-bold text-amber-500">429 Rate Limit</span>
              <p className="text-xs text-muted-foreground">
                Per-IP or per-wallet rate limit exceeded. Retry-After header provided.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-1">
              <span className="font-mono text-xs font-bold text-muted-foreground">500 Crawler Timeout</span>
              <p className="text-xs text-muted-foreground">
                Target host timed out or blocked crawler. Auto-retried once per failure policy.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
