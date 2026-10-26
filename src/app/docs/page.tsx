'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Cpu,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Code2,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

const PUBLIC_AGENT_ADDRESS = '0xf06c2b754d07cba299751f0985a48f8013bb6b39';
const DATA_SUFFIX = '0x63656c6f5f373537633261633362373063110080218021802180218021802180218021';

export default function DocsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-ink font-system selection:bg-lavender-tint selection:text-ink overflow-x-hidden">
      {/* 1. HEADER (64px tall, CrawlPay logo & wordmark) */}
      <header className="sticky top-0 z-50 h-[64px] bg-white dark:bg-[#121317] border-b border-graphite-100 dark:border-graphite-800 transition-colors">
        <div className="max-w-[1176px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Logo Badge + Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0"
          >
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-[10px] bg-ink dark:bg-white text-white dark:text-ink shadow-sm shrink-0">
              <CrawlLogo className="size-4 sm:size-5" />
            </span>
            <span className="font-sans font-[600] text-[18px] sm:text-[20px] text-ink dark:text-white tracking-tight">
              CrawlPay
            </span>
            <span className="hidden xs:inline-block rounded-[6px] bg-graphite-100 dark:bg-[#22232c] px-2 py-0.5 text-[11px] font-mono text-graphite-600 dark:text-graphite-300 font-medium ml-1">
              Docs
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-[32px] font-sans text-[16px] font-[400] text-ink dark:text-graphite-200 leading-[1.5] shrink-0">
            <Link href="/" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Home
            </Link>
            <Link href="/example" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Demo
            </Link>
            <Link href="/#features" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Features
            </Link>
            <Link href="/#how-it-works" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              How It Works
            </Link>
            <Link href="/terms" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Terms
            </Link>
            <Link href="/#faq" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              FAQ
            </Link>
          </nav>

          {/* Right Action: Theme Toggle + Capsule Button + Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            <Link
              href="/app/audit"
              className="hidden sm:inline-flex bg-ink dark:bg-white text-white dark:text-ink rounded-[48px] px-[20px] sm:px-[24px] py-[7px] text-[14px] leading-[1.6] font-normal hover:opacity-90 transition-opacity items-center justify-center cursor-pointer whitespace-nowrap shrink-0"
            >
              Launch CrawlPay
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex lg:hidden p-1.5 text-ink dark:text-white hover:opacity-70 transition-opacity focus:outline-none shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-[#121317] border-b border-graphite-100 dark:border-graphite-800 px-4 py-4 space-y-3 shadow-lg">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5"
            >
              Home
            </Link>
            <Link
              href="/example"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5"
            >
              Demo Preview
            </Link>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5"
            >
              Terms &amp; Policies
            </Link>
            <div className="pt-2 border-t border-graphite-100 dark:border-graphite-800">
              <Link
                href="/app/audit"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-ink dark:bg-white text-white dark:text-ink rounded-[48px] px-[24px] py-[10px] text-[14px] leading-[1.6] font-normal hover:opacity-90 transition-opacity inline-flex items-center justify-center cursor-pointer"
              >
                Launch CrawlPay
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO / BANNER: Calm editorial gray background */}
      <section className="bg-[#f4f4f6] border-b border-graphite-100 py-[48px] sm:py-[64px]">
        <div className="max-w-[1020px] mx-auto px-4 sm:px-6">
          <div className="space-y-3">
            <p className="font-sans text-[15px] sm:text-[18px] leading-[1.6] font-[400] text-violet mb-2">
              Developer &amp; Agent Protocol Reference
            </p>
            <h1 className="font-sans text-[32px] sm:text-[44px] font-[600] leading-[1.15] text-ink tracking-tight">
              Agents, MCP &amp; x402 Protocol Specs
            </h1>
            <p className="text-[15px] sm:text-[17px] leading-[1.6] text-graphite-800 font-normal max-w-[760px]">
              CrawlPay provides autonomous AI agents, LLM pipelines, and automated tooling with deterministic SEO analysis and competitive intelligence. Settled on Celo Mainnet per crawl via x402—zero accounts or subscriptions required.
            </p>
          </div>
        </div>
      </section>

      {/* 3. MAIN DOCS CONTENT */}
      <main className="max-w-[1020px] mx-auto px-4 sm:px-6 py-[48px] sm:py-[64px] space-y-12">
        {/* Section 1: Endpoints */}
        <section id="endpoints" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100">
            <Code2 className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink">
              API Endpoints Reference
            </h2>
          </div>

          <div className="space-y-4">
            {/* POST /api/audit */}
            <div className="rounded-[16px] border border-graphite-100 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-bold">
                    POST
                  </span>
                  <span className="font-bold text-ink">/api/audit</span>
                </div>
                <span className="text-[13px] text-violet font-mono font-medium">
                  $0.25 - $0.50 USDT / USDC / CELO
                </span>
              </div>
              <p className="text-[14px] text-graphite-800 leading-relaxed font-normal">
                Initiates a deterministic crawler audit. Returns 10 technical SEO checks, root cause finding groups, and copy-pasteable framework patches.
              </p>
              <div className="rounded-[8px] bg-graphite-900 p-4 font-mono text-[12px] text-graphite-200 overflow-x-auto">
                <pre>{`// Request Body:
{
  "url": "https://example.com",
  "mode": "quick", // "quick" ($0.25) or "full" ($0.50)
  "paymentProof": "0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5"
}`}</pre>
              </div>
            </div>

            {/* GET /api/x402-bazaar */}
            <div className="rounded-[16px] border border-graphite-100 bg-white p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 font-bold">
                    GET
                  </span>
                  <span className="font-bold text-ink">/api/x402-bazaar</span>
                </div>
                <span className="text-[13px] text-graphite-600 font-mono">Free Public Catalog</span>
              </div>
              <p className="text-[14px] text-graphite-800 leading-relaxed font-normal">
                Agent-discoverable schema exposing services, prices, accepted payment tokens, and ERC-8004 identity status.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Payment Flow for Autonomous Agents */}
        <section className="space-y-6 pt-4 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100">
            <Zap className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink">
              x402 Payment Flow for Autonomous Agents
            </h2>
          </div>

          <div className="rounded-[16px] border border-graphite-100 bg-white p-6 space-y-4 shadow-sm">
            <ol className="list-decimal list-inside space-y-3 text-[14px] text-graphite-800 leading-relaxed font-normal">
              <li>
                <strong className="text-ink font-medium">Initial Request:</strong> The agent sends a request with header{' '}
                <code className="rounded-[4px] bg-graphite-100 px-1.5 py-0.5 text-ink font-mono text-[13px]">
                  Accept: application/x402+json
                </code>.
              </li>
              <li>
                <strong className="text-ink font-medium">HTTP 402 Handshake:</strong> If no payment proof is attached, CrawlPay responds with{' '}
                <code className="rounded-[4px] bg-graphite-100 px-1.5 py-0.5 text-violet font-mono text-[13px]">
                  402 Payment Required
                </code>{' '}
                containing the recipient address (<code className="font-mono text-ink text-[12px]">{PUBLIC_AGENT_ADDRESS}</code>), price ($0.25 USDT), and attribution suffix.
              </li>
              <li>
                <strong className="text-ink font-medium">Attributed Settlement:</strong> The agent broadcasts a transaction on Celo Mainnet appending the ERC-8021 calldata tag:
                <div className="mt-2 flex items-center justify-between rounded-[8px] bg-graphite-100/60 p-2.5 font-mono text-[12px] text-ink border border-graphite-100">
                  <span className="truncate mr-2">{DATA_SUFFIX}</span>
                  <button
                    type="button"
                    onClick={() => copy(DATA_SUFFIX, 'suffix')}
                    className="text-violet hover:underline shrink-0 font-medium cursor-pointer"
                  >
                    {copiedKey === 'suffix' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </li>
              <li>
                <strong className="text-ink font-medium">Fulfillment:</strong> The agent replays the request with header{' '}
                <code className="rounded-[4px] bg-graphite-100 px-1.5 py-0.5 text-ink font-mono text-[13px]">
                  Authorization: x402 &lt;tx_hash&gt;
                </code>. CrawlPay verifies the transaction on Celo and returns the deterministic audit.
              </li>
            </ol>
          </div>
        </section>

        {/* Section 3: Agent Hotwallet Settle */}
        <section className="space-y-6 pt-4 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100">
            <Terminal className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink">
              Autonomous Agent Hotwallet Settlement
            </h2>
          </div>

          <div className="rounded-[16px] border border-graphite-100 bg-white p-6 space-y-4 shadow-sm">
            <p className="text-[14px] text-graphite-800 leading-relaxed font-normal">
              Autonomous bots operating without a browser extension can execute settlements directly via an EVM hotwallet client using{' '}
              <code className="text-violet font-mono text-[13px]">viem</code> or{' '}
              <code className="text-violet font-mono text-[13px]">@celo/attribution-tags</code>.
            </p>

            <div className="rounded-[8px] bg-graphite-900 p-4 font-mono text-[12px] text-graphite-200 overflow-x-auto">
              <pre>{`import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

// Initialize agent wallet client
const account = privateKeyToAccount(process.env.AGENT_HOTWALLET_KEY as \`0x\${string}\`);
const client = createWalletClient({
  account,
  chain: celo,
  transport: http('https://forno.celo.org')
});

// Broadcast attributed payment on Celo
const txHash = await client.sendTransaction({
  to: '${PUBLIC_AGENT_ADDRESS}',
  value: 0n, // Attributed micropayment
  data: '${DATA_SUFFIX}' // ERC-8021 suffix
});

console.log('Mined payment tx:', txHash);`}</pre>
            </div>
          </div>
        </section>

        {/* Section 4: MCP Setup */}
        <section id="mcp" className="space-y-6 pt-4 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100">
            <BookOpen className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink">
              Model Context Protocol (MCP) Setup
            </h2>
          </div>

          <div className="rounded-[16px] border border-graphite-100 bg-white p-6 space-y-4 shadow-sm">
            <p className="text-[14px] text-graphite-800 leading-relaxed font-normal">
              Add CrawlPay as an MCP tool inside Claude Desktop, Cursor, or your custom AI assistant by appending this block to your{' '}
              <code className="text-violet font-mono text-[13px]">claude_desktop_config.json</code>:
            </p>

            <div className="rounded-[8px] bg-graphite-900 p-4 font-mono text-[12px] text-graphite-200 overflow-x-auto">
              <pre>{`{
  "mcpServers": {
    "crawlpay": {
      "command": "npx",
      "args": ["-y", "@crawlpay/mcp-server"],
      "env": {
        "CELO_RPC_URL": "https://forno.celo.org",
        "AGENT_WALLET_ADDRESS": "${PUBLIC_AGENT_ADDRESS}"
      }
    }
  }
}`}</pre>
            </div>
          </div>
        </section>

        {/* Section 5: Error Codes */}
        <section className="space-y-6 pt-4 pb-8">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100">
            <Cpu className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink">
              Engine Status &amp; Error Codes
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[12px] border border-graphite-100 bg-white p-4 space-y-1.5 shadow-sm">
              <span className="font-mono text-[12px] font-bold text-ink">400 Bad Request</span>
              <p className="text-[13px] text-graphite-800 font-normal leading-relaxed">
                Target URL failed SSRF validation (private network, loopback, or cloud metadata IP).
              </p>
            </div>

            <div className="rounded-[12px] border border-graphite-100 bg-white p-4 space-y-1.5 shadow-sm">
              <span className="font-mono text-[12px] font-bold text-violet">402 Payment Required</span>
              <p className="text-[13px] text-graphite-800 font-normal leading-relaxed">
                Audit requires micropayment settlement. Returns challenge parameters and Celo recipient.
              </p>
            </div>

            <div className="rounded-[12px] border border-graphite-100 bg-white p-4 space-y-1.5 shadow-sm">
              <span className="font-mono text-[12px] font-bold text-ink">429 Rate Limit</span>
              <p className="text-[13px] text-graphite-800 font-normal leading-relaxed">
                Per-IP or per-wallet rate limit exceeded. Retry-After header provided.
              </p>
            </div>

            <div className="rounded-[12px] border border-graphite-100 bg-white p-4 space-y-1.5 shadow-sm">
              <span className="font-mono text-[12px] font-bold text-ink">500 Crawler Timeout</span>
              <p className="text-[13px] text-graphite-800 font-normal leading-relaxed">
                Target host timed out or blocked crawler. Auto-retried once per failure policy.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 4. INK FOOTER */}
      <footer className="w-full bg-ink border-t border-graphite-900 pt-[48px] sm:pt-[64px] pb-[36px] sm:pb-[48px]">
        <div className="max-w-[1176px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-[32px] text-left">
            {/* Column 1: Brand & Identity */}
            <div className="space-y-[12px]">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-[8px] bg-white text-ink shadow-sm shrink-0">
                  <CrawlLogo className="size-4" />
                </span>
                <span className="font-sans font-[600] text-[20px] text-white tracking-tight">
                  CrawlPay
                </span>
              </div>
              <p className="font-footer text-[14px] leading-[20px] text-graphite-200 font-normal">
                Autonomous technical SEO and competitor intelligence audit agent settled per crawl on Celo mainnet.
              </p>
              <div className="pt-2">
                <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 block">
                  Chain ID: 42220 (Celo Mainnet)
                </span>
                <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 block">
                  Protocol: x402 Micropayments
                </span>
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div className="space-y-[12px]">
              <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
                NAVIGATION
              </span>
              <div className="space-y-[12px] font-footer text-[14px] leading-[20px]">
                <div>
                  <Link href="/app/audit" className="text-graphite-200 hover:text-white transition-colors">
                    Site Audit
                  </Link>
                </div>
                <div>
                  <Link href="/app/reports" className="text-graphite-200 hover:text-white transition-colors">
                    Reports Archive
                  </Link>
                </div>
                <div>
                  <Link href="/example" className="text-graphite-200 hover:text-white transition-colors">
                    Verified Demo Preview
                  </Link>
                </div>
              </div>
            </div>

            {/* Column 3: Developers */}
            <div className="space-y-[12px]">
              <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
                DEVELOPERS
              </span>
              <div className="space-y-[12px] font-footer text-[14px] leading-[20px]">
                <div>
                  <Link href="/docs" className="text-graphite-200 hover:text-white transition-colors">
                    Documentation &amp; API
                  </Link>
                </div>
                <div>
                  <Link href="/docs#mcp" className="text-graphite-200 hover:text-white transition-colors">
                    MCP Agent Setup
                  </Link>
                </div>
                <div>
                  <a
                    href="/api/status"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-graphite-200 hover:text-white transition-colors"
                  >
                    REST API Status
                  </a>
                </div>
              </div>
            </div>

            {/* Column 4: Policies */}
            <div className="space-y-[12px]">
              <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
                POLICIES
              </span>
              <div className="space-y-[12px] font-footer text-[14px] leading-[20px]">
                <div>
                  <Link href="/terms#about" className="text-graphite-200 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </div>
                <div>
                  <Link href="/terms#refund" className="text-graphite-200 hover:text-white transition-colors">
                    Refund Guarantee Policy
                  </Link>
                </div>
                <div>
                  <Link href="/terms#security" className="text-graphite-200 hover:text-white transition-colors">
                    SSRF Security Protections
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-graphite-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-footer text-[13px] sm:text-[14px] leading-[20px]">
            <p className="text-graphite-300">
              &copy; {new Date().getFullYear()} CrawlPay. All rights reserved. Zero subscriptions, on-demand execution.
            </p>
            <div className="flex items-center gap-2 text-graphite-300 text-[12px] font-mono">
              <span>Agent:</span>
              <a
                href={`https://celoscan.io/address/${PUBLIC_AGENT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-graphite-200 hover:text-white hover:underline"
              >
                {PUBLIC_AGENT_ADDRESS.slice(0, 8)}...{PUBLIC_AGENT_ADDRESS.slice(-6)}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
