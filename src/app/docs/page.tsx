'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Cpu,
  Zap,
  Code2,
  BookOpen,
  CheckCircle2,
  FolderOpen,
  RefreshCw,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';
import { SiteHeader, focusRing } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { useConfig } from '@/context/ConfigContext';

const PUBLIC_AGENT_ADDRESS = '0xf06c2b754d07cba299751f0985a48f8013bb6b39';
const USDT_CELO_ADDRESS = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';
const DATA_SUFFIX = '0x63656c6f5f37353763326163336237306311008021802180218021802180218021';

export default function DocsPage() {
  const { fullPriceFormatted, fullPriceRaw } = useConfig();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Documentation & Protocols (SEO, AEO & GEO) | CrawlPay';
  }, []);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0e12] text-ink dark:text-white font-system selection:bg-lavender-tint selection:text-ink overflow-x-hidden transition-colors">
      {/* 1. SHARED SITE HEADER */}
      <SiteHeader />

      {/* 2. HERO / BANNER */}
      <section className="bg-[#f4f4f6] dark:bg-[#121317] border-b border-graphite-100 dark:border-graphite-800 py-[48px] sm:py-[64px] transition-colors">
        <div className="max-w-[1020px] mx-auto px-4 sm:px-6">
          <div className="space-y-3">
            <p className="font-sans text-[15px] sm:text-[18px] leading-[1.6] font-[400] text-violet mb-2">
              SEO, AEO &amp; GEO Engine &bull; Developer &amp; Agent Reference
            </p>
            <h1 className="font-sans text-[32px] sm:text-[44px] font-[600] leading-[1.15] text-ink dark:text-white tracking-tight">
              API, MCP &amp; x402 Protocol Specs
            </h1>
            <p className="text-[15px] sm:text-[17px] leading-[1.6] text-graphite-800 dark:text-graphite-200 font-normal max-w-[760px]">
              CrawlPay gives developers, AI assistants and autonomous agents site audit tools for Google and AI search. Paid deep crawls settle on Celo Mainnet in USDT per crawl via x402—no account or subscription required.
            </p>

            {/* Quick in-page anchor links */}
            <div className="pt-2 flex flex-wrap gap-2 text-[13px]">
              <a href="#mcp" className={`rounded-full bg-white dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-700 px-3 py-1 text-ink dark:text-white hover:border-violet ${focusRing}`}>
                Claude &amp; MCP Setup
              </a>
              <a href="#api" className={`rounded-full bg-white dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-700 px-3 py-1 text-ink dark:text-white hover:border-violet ${focusRing}`}>
                API Endpoints
              </a>
              <a href="#x402" className={`rounded-full bg-white dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-700 px-3 py-1 text-ink dark:text-white hover:border-violet ${focusRing}`}>
                x402 Micropayments
              </a>
              <a href="#errors" className={`rounded-full bg-white dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-700 px-3 py-1 text-ink dark:text-white hover:border-violet ${focusRing}`}>
                Status &amp; Errors
              </a>
            </div>

            {/* Core Term Definitions: SEO vs AEO vs GEO */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 space-y-1 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <span className="font-sans font-[600] text-[14px] text-ink dark:text-white">SEO</span>
                </div>
                <p className="text-[11px] font-mono text-graphite-500 dark:text-graphite-400 uppercase">Search Engine Optimization</p>
                <p className="text-[12px] text-graphite-700 dark:text-graphite-300 leading-relaxed font-normal">
                  Helping Google and Bing find, crawl and index your pages via canonical tags, robots directives, schema markup and Core Web Vitals.
                </p>
              </div>

              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 space-y-1 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-violet" />
                  <span className="font-sans font-[600] text-[14px] text-ink dark:text-white">AEO</span>
                </div>
                <p className="text-[11px] font-mono text-graphite-500 dark:text-graphite-400 uppercase">Answer Engine Optimization</p>
                <p className="text-[12px] text-graphite-700 dark:text-graphite-300 leading-relaxed font-normal">
                  Structuring questions, direct answers, and FAQ markup so AI tools (ChatGPT, Perplexity, Claude) extract answers directly from your content.
                </p>
              </div>

              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 space-y-1 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="font-sans font-[600] text-[14px] text-ink dark:text-white">GEO</span>
                </div>
                <p className="text-[11px] font-mono text-graphite-500 dark:text-graphite-400 uppercase">Generative Engine Optimization</p>
                <p className="text-[12px] text-graphite-700 dark:text-graphite-300 leading-relaxed font-normal">
                  Making your site readable, verifiable and quotable when generative search engines synthesize answers and cite sources.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN DOCS CONTENT */}
      <main className="max-w-[1020px] mx-auto px-4 sm:px-6 py-[48px] sm:py-[64px] space-y-12">
        {/* Section 1: Connect to Claude (MCP) - Step-by-Step Guide */}
        <section id="mcp" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100 dark:border-graphite-800">
            <BookOpen className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink dark:text-white">
              Connect to Claude (MCP Setup Guide)
            </h2>
          </div>

          <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 space-y-6 shadow-sm">
            <p className="text-[15px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
              Connect CrawlPay to <strong className="text-ink dark:text-white font-medium">Claude Desktop</strong> or <strong className="text-ink dark:text-white font-medium">Cursor</strong> through the Model Context Protocol (MCP). When you ask Claude why a website is missing from AI search or Google, Claude audits the live site directly instead of guessing.
            </p>

            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-violet text-white text-[12px] font-bold">1</span>
                <h3 className="font-sans text-[16px] font-[600] text-ink dark:text-white flex items-center gap-1.5">
                  <FolderOpen className="size-4 text-violet" />
                  Open your Claude Desktop configuration file
                </h3>
              </div>
              <p className="text-[14px] text-graphite-700 dark:text-graphite-300 pl-0 sm:pl-8">
                Open or create your Claude Desktop config file in your preferred text editor:
              </p>
              <div className="pl-0 sm:pl-8 space-y-2.5 text-[13px] font-mono w-full max-w-full">
                {/* macOS Config Path Card */}
                <div className="w-full max-w-full p-3 rounded-[10px] bg-graphite-100 dark:bg-graphite-900 border border-graphite-200 dark:border-graphite-800 text-graphite-800 dark:text-graphite-200 space-y-2 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[12px] text-ink dark:text-white uppercase tracking-wider">macOS</span>
                    <button
                      type="button"
                      onClick={() => copy('~/Library/Application Support/Claude/claude_desktop_config.json', 'path-mac')}
                      className={`inline-flex items-center gap-1.5 text-violet hover:underline text-[12px] font-medium cursor-pointer shrink-0 ${focusRing}`}
                    >
                      {copiedKey === 'path-mac' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                      <span>{copiedKey === 'path-mac' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-[6px] bg-white dark:bg-[#121317] border border-graphite-200/70 dark:border-graphite-800 text-[12px] font-mono text-graphite-700 dark:text-graphite-300 break-all select-all leading-relaxed overflow-x-auto">
                    ~/Library/Application Support/Claude/claude_desktop_config.json
                  </div>
                </div>

                {/* Windows Config Path Card */}
                <div className="w-full max-w-full p-3 rounded-[10px] bg-graphite-100 dark:bg-graphite-900 border border-graphite-200 dark:border-graphite-800 text-graphite-800 dark:text-graphite-200 space-y-2 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[12px] text-ink dark:text-white uppercase tracking-wider">Windows</span>
                    <button
                      type="button"
                      onClick={() => copy('%APPDATA%\\Claude\\claude_desktop_config.json', 'path-win')}
                      className={`inline-flex items-center gap-1.5 text-violet hover:underline text-[12px] font-medium cursor-pointer shrink-0 ${focusRing}`}
                    >
                      {copiedKey === 'path-win' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                      <span>{copiedKey === 'path-win' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-[6px] bg-white dark:bg-[#121317] border border-graphite-200/70 dark:border-graphite-800 text-[12px] font-mono text-graphite-700 dark:text-graphite-300 break-all select-all leading-relaxed overflow-x-auto">
                    %APPDATA%\Claude\claude_desktop_config.json
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-violet text-white text-[12px] font-bold">2</span>
                <h3 className="font-sans text-[16px] font-[600] text-ink dark:text-white flex items-center gap-1.5">
                  <Code2 className="size-4 text-violet" />
                  Add CrawlPay to the configuration
                </h3>
              </div>
              <p className="text-[14px] text-graphite-700 dark:text-graphite-300 pl-0 sm:pl-8">
                Paste the following block inside the <code className="font-mono text-ink dark:text-white text-[13px]">&quot;mcpServers&quot;</code> object:
              </p>
              <div className="pl-0 sm:pl-8">
                <div className="rounded-[10px] bg-graphite-900 border border-graphite-800 overflow-hidden font-mono text-[12px]">
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-graphite-800 bg-[#14151a]">
                    <span className="text-[11px] font-mono text-graphite-400">claude_desktop_config.json</span>
                    <button
                      type="button"
                      onClick={() =>
                        copy(
                          JSON.stringify(
                            {
                              mcpServers: {
                                crawlpay: {
                                  command: 'node',
                                  args: [
                                    '/path/to/Crawlpay/node_modules/tsx/dist/cli.mjs',
                                    '/path/to/Crawlpay/scripts/mcp-server.ts',
                                  ],
                                  env: {
                                    CELO_RPC_URL: 'https://forno.celo.org',
                                    AGENT_WALLET_ADDRESS: PUBLIC_AGENT_ADDRESS,
                                    ATTRIBUTION_TAG: 'celo_757c2ac3b70c',
                                  },
                                },
                              },
                            },
                            null,
                            2
                          ),
                          'claude-cfg'
                        )
                      }
                      className={`inline-flex items-center gap-1.5 text-violet hover:underline text-[12px] font-medium cursor-pointer ${focusRing}`}
                    >
                      {copiedKey === 'claude-cfg' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>{copiedKey === 'claude-cfg' ? 'Copied' : 'Copy configuration'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-graphite-200 overflow-x-auto leading-relaxed">{`{
  "mcpServers": {
    "crawlpay": {
      "command": "node",
      "args": [
        "/path/to/Crawlpay/node_modules/tsx/dist/cli.mjs",
        "/path/to/Crawlpay/scripts/mcp-server.ts"
      ],
      "env": {
        "CELO_RPC_URL": "https://forno.celo.org",
        "AGENT_WALLET_ADDRESS": "${PUBLIC_AGENT_ADDRESS}",
        "ATTRIBUTION_TAG": "celo_757c2ac3b70c"
      }
    }
  }
}`}</pre>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-violet text-white text-[12px] font-bold">3</span>
                <h3 className="font-sans text-[16px] font-[600] text-ink dark:text-white flex items-center gap-1.5">
                  <RefreshCw className="size-4 text-violet" />
                  Restart Claude Desktop
                </h3>
              </div>
              <p className="text-[14px] text-graphite-700 dark:text-graphite-300 pl-0 sm:pl-8">
                Completely quit Claude Desktop (Cmd+Q on macOS, or exit from the Windows system tray) and relaunch it. Once open, look for the hammer icon in the prompt input bar: clicking it will confirm <strong className="text-ink dark:text-white font-medium">crawlpay</strong> tools are active and ready.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-violet text-white text-[12px] font-bold">4</span>
                <h3 className="font-sans text-[16px] font-[600] text-ink dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="size-4 text-violet" />
                  Ask Claude to audit your site
                </h3>
              </div>
              <p className="text-[14px] text-graphite-700 dark:text-graphite-300 pl-0 sm:pl-8">
                Ask Claude directly in chat. It will invoke CrawlPay&apos;s crawler and report back with findings and code fixes:
              </p>
              <div className="pl-0 sm:pl-8 grid sm:grid-cols-2 gap-2 text-[13px]">
                <div className="p-3 rounded-[8px] bg-graphite-100 dark:bg-graphite-900 border border-graphite-200 dark:border-graphite-800 text-graphite-800 dark:text-graphite-200">
                  &ldquo;Why isn&apos;t my site https://example.com showing up in ChatGPT or Perplexity?&rdquo;
                </div>
                <div className="p-3 rounded-[8px] bg-graphite-100 dark:bg-graphite-900 border border-graphite-200 dark:border-graphite-800 text-graphite-800 dark:text-graphite-200">
                  &ldquo;Run an SEO and direct-answer check on https://mysite.com and give me code fixes.&rdquo;
                </div>
              </div>
            </div>

            {/* Step 5: Cursor configuration tab */}
            <div className="pt-4 border-t border-graphite-100 dark:border-graphite-800 space-y-2">
              <h4 className="font-sans text-[15px] font-[600] text-ink dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Also works in Cursor (.cursor/mcp.json)
              </h4>
              <p className="text-[13px] text-graphite-700 dark:text-graphite-300">
                To connect inside Cursor, place the same configuration inside <code className="font-mono text-ink dark:text-white text-[12px]">.cursor/mcp.json</code> in your project workspace.
              </p>
            </div>

            {/* Exposed Tools */}
            <div className="pt-2">
              <h4 className="text-[14px] font-semibold text-ink dark:text-white mb-2">Available MCP Tools Exposed to Claude:</h4>
              <ul className="text-[13px] text-graphite-700 dark:text-graphite-300 space-y-1.5 list-disc list-inside">
                <li><code className="text-violet font-mono text-[12px]">crawlpay_audit_site</code>: Runs technical SEO, AEO, and GEO audits, Core Web Vitals checks, and returns copy-paste fixes with a Celo receipt.</li>
                <li><code className="text-violet font-mono text-[12px]">crawlpay_compare_competitor</code>: Head-to-head competitor audit with gap analysis and a 3-step action plan.</li>
                <li><code className="text-violet font-mono text-[12px]">crawlpay_agent_status</code>: Real-time Celo block height, gas prices, wallet balances, and ERC-8004 identity status.</li>
                <li><code className="text-violet font-mono text-[12px]">handle_payment_required</code>: Automatic x402 payment resolution on Celo Mainnet.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Endpoints & API */}
        <section id="api" className="space-y-6 scroll-mt-24">
          <div id="endpoints" className="scroll-mt-24" />
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100 dark:border-graphite-800">
            <Code2 className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink dark:text-white">
              API Endpoints Reference
            </h2>
          </div>

          <div className="space-y-4">
            {/* POST /api/audit */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 font-bold">
                    POST
                  </span>
                  <span className="font-bold text-ink dark:text-white">/api/audit</span>
                </div>
                <span className="text-[13px] text-violet font-mono font-medium" suppressHydrationWarning>
                  Free (Quick audit) or {fullPriceFormatted} USDT (Deep crawl)
                </span>
              </div>
              <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                Runs an audit on a target URL. Checks search bot access, AI crawler permissions, metadata, headings, direct answers, page speed, and returns copy-paste code fixes.
              </p>
              <div className="rounded-[8px] bg-graphite-900 p-4 font-mono text-[12px] text-graphite-200 overflow-x-auto">
                <pre>{`// Request Body:
{
  "url": "https://example.com",
  "mode": "quick", // "quick" (free single page) or "full" (${fullPriceFormatted} deep crawl)
  "paymentProof": "0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5" // required for full mode
}`}</pre>
              </div>
            </div>

            {/* POST /api/compare */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 font-bold">
                    POST
                  </span>
                  <span className="font-bold text-ink dark:text-white">/api/compare</span>
                </div>
                <span className="text-[13px] text-violet font-mono font-medium">
                  Side-by-Side Comparison
                </span>
              </div>
              <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                Compares a target page against a competitor page across speed, structured data coverage, answer clarity, and gives a prioritized 3-step action plan.
              </p>
              <div className="rounded-[8px] bg-graphite-900 p-4 font-mono text-[12px] text-graphite-200 overflow-x-auto">
                <pre>{`// Request Body:
{
  "targetUrl": "https://yoursite.com",
  "competitorUrl": "https://competitor.com",
  "mode": "quick" // optional, defaults to "quick"
}

// Response:
{
  "targetReport": { ... },     // Full target audit report
  "competitorReport": { ... }, // Competitor audit report
  "comparison": {
    "winner": "target",        // "target" | "competitor" | "tie"
    "speedDiffMs": 340,        // Speed difference in milliseconds
    "schemaDiff": 2,           // Structured data count gap
    "seoGap": [
      "Target has FAQSchema while competitor is missing conversational markup"
    ],
    "actionItems": [
      "1. Add LocalBusiness schema to improve local presence",
      "2. Optimize largest contentful image to widen speed advantage",
      "3. Expand H2 question answers for AI search extraction"
    ]
  }
}`}</pre>
              </div>
            </div>

            {/* GET /api/status */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 font-bold">
                    GET
                  </span>
                  <span className="font-bold text-ink dark:text-white">/api/status</span>
                </div>
                <span className="text-[13px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">Service Health</span>
              </div>
              <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                Returns the service operational status and running version.
              </p>
              <div className="rounded-[8px] bg-graphite-900 p-4 font-mono text-[12px] text-graphite-200 overflow-x-auto">
                <pre>{`// Response:
{
  "status": "operational",
  "version": "2.0.0"
}`}</pre>
              </div>
            </div>

            {/* GET /api/agent/status */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 font-bold">
                    GET
                  </span>
                  <span className="font-bold text-ink dark:text-white">/api/agent/status</span>
                </div>
                <span className="text-[13px] text-graphite-600 dark:text-graphite-400 font-mono">Onchain Telemetry</span>
              </div>
              <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                Live Celo Mainnet telemetry, block height, gas prices, agent balances, and gas sufficiency status.
              </p>
              <div className="rounded-[8px] bg-graphite-900 p-4 font-mono text-[12px] text-graphite-200 overflow-x-auto">
                <pre>{`// Response:
{
  "network": "Celo Mainnet (42220)",
  "blockHeight": 28419200,
  "gasPriceGwei": "5.0",
  "balances": {
    "celo": "2.450",
    "usdt": "18.50"
  },
  "erc8004Registered": true
}`}</pre>
              </div>
            </div>

            {/* GET /api/x402-bazaar */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 font-bold">
                    GET
                  </span>
                  <span className="font-bold text-ink dark:text-white">/api/x402-bazaar</span>
                </div>
                <span className="text-[13px] text-graphite-600 dark:text-graphite-400 font-mono">Public Service Catalog</span>
              </div>
              <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                Machine-discoverable catalog exposing pricing, input schemas, and x402 payment headers for AI search networks and crawler bots.
              </p>
            </div>

            {/* GET /.well-known/agent-card.json */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 font-bold">
                    GET
                  </span>
                  <span className="font-bold text-ink dark:text-white">/.well-known/agent-card.json</span>
                </div>
                <span className="text-[13px] text-graphite-600 dark:text-graphite-400 font-mono">A2A Agent Card</span>
              </div>
              <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                Standardized agent discovery card advertising technical SEO crawling, AEO and GEO signals, keyword alignment, and x402 settlement capabilities.
              </p>
            </div>

            {/* GET /api/agent-registration */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 font-bold">
                    GET
                  </span>
                  <span className="font-bold text-ink dark:text-white">/api/agent-registration</span>
                </div>
                <span className="text-[13px] text-graphite-600 dark:text-graphite-400 font-mono">ERC-8004 Identity</span>
              </div>
              <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                Onchain identity registration metadata complying with EIP-8004 on Celo Mainnet for autonomous agent reputation and verification.
              </p>
            </div>

            {/* GET /api/live-proof */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 font-bold">
                    GET
                  </span>
                  <span className="font-bold text-ink dark:text-white">/api/live-proof</span>
                </div>
                <span className="text-[13px] text-graphite-600 dark:text-graphite-400 font-mono">Proof Counter</span>
              </div>
              <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                Returns the live verified counter of completed audits and onchain transactions settled on Celo.
              </p>
            </div>

            {/* POST /api/payment/verify */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 font-bold">
                    POST
                  </span>
                  <span className="font-bold text-ink dark:text-white">/api/payment/verify</span>
                </div>
                <span className="text-[13px] text-violet font-mono font-medium">Payment Verification</span>
              </div>
              <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                Verifies an onchain USDT micropayment on Celo with ERC-8021 attribution suffix before starting a deep crawl.
              </p>
            </div>

            {/* GET /api/reports and /api/reports/[id] */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="rounded-[4px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 font-bold">
                    GET
                  </span>
                  <span className="font-bold text-ink dark:text-white">/api/reports &amp; /api/reports/[id]</span>
                </div>
                <span className="text-[13px] text-graphite-600 dark:text-graphite-400 font-mono">Saved Reports</span>
              </div>
              <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                Retrieves stored audit reports by wallet address or specific report ID. Also supports <code className="font-mono text-ink dark:text-white">POST /api/reports/[id]/pdf</code> for printable client-ready summaries.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: x402 Micropayments */}
        <section id="x402" className="space-y-6 pt-4 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100 dark:border-graphite-800">
            <Zap className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink dark:text-white">
              x402 Micropayments for AI Agents
            </h2>
          </div>

          <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 space-y-4 shadow-sm">
            <ol className="list-decimal list-inside space-y-3 text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
              <li>
                <strong className="text-ink dark:text-white font-medium">Initial Request:</strong> The agent calls an endpoint with header{' '}
                <code className="rounded-[4px] bg-graphite-100 dark:bg-graphite-800 px-1.5 py-0.5 text-ink dark:text-white font-mono text-[13px]">
                  Accept: application/x402+json
                </code>.
              </li>
              <li>
                <strong className="text-ink dark:text-white font-medium">HTTP 402 Challenge:</strong> For a deep crawl without payment proof, CrawlPay responds with{' '}
                <code className="rounded-[4px] bg-graphite-100 dark:bg-graphite-800 px-1.5 py-0.5 text-violet font-mono text-[13px]">
                  402 Payment Required
                </code>{' '}
                specifying the Celo recipient (<code className="font-mono text-ink dark:text-white text-[12px]">{PUBLIC_AGENT_ADDRESS}</code>), price ({fullPriceFormatted} in USDT on Celo; quick audits are free), and attribution tag.
              </li>
              <li>
                <strong className="text-ink dark:text-white font-medium">Attributed Settlement:</strong> The agent broadcasts an ERC-20 transfer in USDT on Celo Mainnet appending the ERC-8021 calldata tag:
                <div className="mt-2 flex items-center justify-between rounded-[8px] bg-graphite-100/60 dark:bg-graphite-900 p-2.5 font-mono text-[12px] text-ink dark:text-white border border-graphite-200 dark:border-graphite-800">
                  <span className="truncate mr-2">{DATA_SUFFIX}</span>
                  <button
                    type="button"
                    onClick={() => copy(DATA_SUFFIX, 'suffix')}
                    className={`text-violet hover:underline shrink-0 font-medium cursor-pointer ${focusRing}`}
                  >
                    {copiedKey === 'suffix' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </li>
              <li>
                <strong className="text-ink dark:text-white font-medium">Fulfillment:</strong> The agent replays the request with header{' '}
                <code className="rounded-[4px] bg-graphite-100 dark:bg-graphite-800 px-1.5 py-0.5 text-ink dark:text-white font-mono text-[13px]">
                  Authorization: x402 &lt;tx_hash&gt;
                </code>. CrawlPay verifies the transaction on Celo and returns the completed audit report.
              </li>
            </ol>
          </div>

          {/* Autonomous Hotwallet Settlement Example */}
          <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-violet" />
              <h3 className="font-sans text-[17px] font-[600] text-ink dark:text-white">
                Autonomous Bot Hotwallet Settlement Example
              </h3>
            </div>
            <p className="text-[14px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
              Autonomous bots operating without a browser extension can settle directly via an EVM hotwallet using{' '}
              <code className="text-violet font-mono text-[13px]">viem</code>.
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

// Broadcast attributed ${fullPriceRaw} USDT payment on Celo
const USDT_ADDRESS = '${USDT_CELO_ADDRESS}';
const txHash = await client.sendTransaction({
  to: USDT_ADDRESS,
  value: 0n,
  // ERC-20 transfer(to, ${(parseFloat(fullPriceRaw || '0.50') * 1_000_000).toFixed(0)} units = ${fullPriceFormatted} USDT) + ERC-8021 suffix
  data: ('0xa9059cbb' +
    '${PUBLIC_AGENT_ADDRESS.toLowerCase().replace('0x', '').padStart(64, '0')}' +
    '${(BigInt(Math.round(parseFloat(fullPriceRaw || '0.50') * 1_000_000))).toString(16).padStart(64, '0')}' +
    '${DATA_SUFFIX.replace('0x', '')}') as \`0x\${string}\`
});

console.log('Mined payment tx:', txHash);`}</pre>
            </div>
          </div>
        </section>

        {/* Section 4: Status & Error Codes */}
        <section id="errors" className="space-y-6 pt-4 pb-8 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100 dark:border-graphite-800">
            <Cpu className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink dark:text-white">
              Status &amp; Error Codes
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 space-y-1.5 shadow-sm">
              <span className="font-mono text-[12px] font-bold text-ink dark:text-white">400 Bad Request</span>
              <p className="text-[13px] text-graphite-800 dark:text-graphite-200 font-normal leading-relaxed">
                Target address is invalid or blocked by safe crawling policy (private network, localhost, or cloud metadata address).
              </p>
            </div>

            <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 space-y-1.5 shadow-sm">
              <span className="font-mono text-[12px] font-bold text-violet">402 Payment Required</span>
              <p className="text-[13px] text-graphite-800 dark:text-graphite-200 font-normal leading-relaxed">
                Deep crawl requires micropayment settlement. Returns challenge parameters and Celo recipient.
              </p>
            </div>

            <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 space-y-1.5 shadow-sm">
              <span className="font-mono text-[12px] font-bold text-ink dark:text-white">429 Rate Limit</span>
              <p className="text-[13px] text-graphite-800 dark:text-graphite-200 font-normal leading-relaxed">
                Fair-use limit of 5 free quick audits per hour exceeded. Retry-After countdown header is provided.
              </p>
            </div>

            <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 space-y-1.5 shadow-sm">
              <span className="font-mono text-[12px] font-bold text-ink dark:text-white">504 Crawler Timeout</span>
              <p className="text-[13px] text-graphite-800 dark:text-graphite-200 font-normal leading-relaxed">
                Target server did not respond in time. Paid audits that cannot complete are eligible for a refund.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 4. SHARED SITE FOOTER */}
      <SiteFooter />
    </div>
  );
}
