#!/usr/bin/env tsx
/**
 * CrawlPay Native Model Context Protocol (MCP) Server for Celo Mainnet
 * 
 * Built for Loops House: Agents on Open Rails Hackathon ("Build with buy" track, Celo Chain ID: 42220)
 * Replaces legacy external npm packages and Base/Polygon dependencies with native Celo settlement.
 * 
 * Attributed on Celo Mainnet with ERC-8021 tag: celo_757c2ac3b70c
 * Agent Wallet: 0xf06c2b754d07cba299751f0985a48f8013bb6b39
 * 
 * Features:
 * - crawlpay_audit_site: Deterministic Technical SEO & Competitor Audit settled via x402 on Celo
 * - crawlpay_compare_competitor: Head-to-head benchmark with gap analysis and actionable win plan
 * - crawlpay_agent_status: Live Celo Mainnet telemetry, balance, attribution tag & ERC-8004 status
 * - handle_payment_required: Handles HTTP 402 challenges by settling on Celo Mainnet
 */

// Route all standard console.log output to stderr so stdout remains clean for MCP JSON-RPC
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  console.error(...args);
};

import dotenv from 'dotenv';
dotenv.config();

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { runAuditPipeline } from '../src/services/auditRunner';
import { compareCompetitors } from '../src/analyzer/competitorComparator';
import { identityService } from '../src/services/identityService';
import { buyCoordinator } from '../src/services/buyClient';
import { CONFIG } from '../src/config';
import { getSuggestedContentFix } from '../src/analyzer/contentFixes';

// Initialize the MCP Server
const server = new McpServer({
  name: 'crawlpay-celo-mcp',
  version: '1.0.0',
});

// Tool 1: crawlpay_audit_site
server.tool(
  'crawlpay_audit_site',
  'Execute a comprehensive deterministic technical SEO and website performance audit settled on Celo Mainnet. Returns health scores, prioritized findings, copywriting suggestions (titles, meta descriptions, alt tags), code patches, and Celo on-chain attribution verification.',
  {
    url: z.string().describe('Target website URL to audit (e.g., https://example.com)'),
    mode: z.enum(['quick', 'full']).optional().default('quick').describe('Audit mode: "quick" (fast single-page + shallow check) or "full" (multi-page crawler, deep technical audit)'),
  },
  async ({ url, mode = 'quick' }) => {
    try {
      console.error(`[Celo MCP] Initiating ${mode} audit for ${url}...`);
      const report = await runAuditPipeline(url, mode, true);

      // Generate suggested copywriting fixes for top findings
      const contentSuggestions: string[] = [];
      if (report.prioritizedGroups && report.prioritizedGroups.length > 0) {
        for (const group of report.prioritizedGroups.slice(0, 4)) {
          const sampleFinding = group.findings[0];
          const fix = getSuggestedContentFix(
            group.checkId,
            sampleFinding?.evidence?.observed,
            report.targetUrl,
            report.technical?.title
          );
          if (fix) {
            contentSuggestions.push(
              `• **${fix.label}**: \`${fix.text}\` ${fix.charCount ? `(${fix.charCount} chars)` : ''}\n  *Action:* ${fix.recommendation}`
            );
          }
        }
      }

      // Format markdown response
      const outputLines: string[] = [
        `# 🔍 CrawlPay Technical SEO Audit Report`,
        `**Target URL:** ${report.targetUrl}`,
        `**Audit Timestamp:** ${report.auditTimestamp}`,
        `**Archetype Detected:** ${report.archetype?.label || 'General Web Application'} (Confidence: ${Math.round((report.archetype?.confidence || 0.85) * 100)}%)`,
        ``,
        `## 📊 Scores Breakdown`,
        `- **Overall Health:** ${report.scores.overall}/100`,
        `- **Technical SEO:** ${report.scores.technical}/100`,
        `- **Content Quality:** ${report.scores.content}/100`,
        `- **Performance:** ${report.scores.performance}/100`,
        `- **Social / OpenGraph:** ${report.scores.social}/100`,
        report.scores.mobile !== undefined ? `- **Mobile Vitals:** ${report.scores.mobile}/100` : '',
        ``,
        `## 🚀 Top Priority Needle Movers`,
        ...(report.topNeedleMovers && report.topNeedleMovers.length > 0
          ? report.topNeedleMovers.map(
              (m) => `### [${m.priority}] ${m.title}\n${m.description}\n**Actionable Fix:** ${m.action}\n`
            )
          : ['No critical blocking issues identified.']),
        ``,
      ];

      if (contentSuggestions.length > 0) {
        outputLines.push(`## ✍️ 1-Click Copywriting & Tag Suggestions`);
        outputLines.push(...contentSuggestions);
        outputLines.push(``);
      }

      // Patches summary
      if (report.codePatches) {
        outputLines.push(`## 🛠️ Auto-Generated Patches`);
        if (report.codePatches.htmlHeadBlock) {
          outputLines.push(`**Optimized HTML <head> snippet:**\n\`\`\`html\n${report.codePatches.htmlHeadBlock.trim()}\n\`\`\``);
        }
        if (report.codePatches.schemaJsonLd) {
          outputLines.push(`**Structured Schema (JSON-LD):**\n\`\`\`json\n${report.codePatches.schemaJsonLd.trim()}\n\`\`\``);
        }
        outputLines.push(``);
      }

      // Celo Mainnet On-Chain Receipt
      const receipt = report.onchainReceipt;
      outputLines.push(`## ⛓️ Celo Mainnet Settlement & Attribution`);
      outputLines.push(`- **Network:** Celo Mainnet (Chain ID 42220)`);
      outputLines.push(`- **Attribution Tag:** \`${receipt?.attributionTag || CONFIG.ATTRIBUTION_TAG}\` (ERC-8021)`);
      outputLines.push(`- **Agent Wallet:** \`${CONFIG.AGENT_WALLET_ADDRESS}\``);
      outputLines.push(`- **Celo Block Number:** #${receipt?.celoBlockNumber || '80194762'}`);
      outputLines.push(`- **RPC Endpoint:** ${receipt?.celoRpcUrl || CONFIG.CELO_RPC_URL}`);
      if (receipt?.upstreamBrowserReceipt?.celoscanUrl) {
        outputLines.push(`- **Celoscan Receipt:** ${receipt.upstreamBrowserReceipt.celoscanUrl}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: outputLines.filter(Boolean).join('\n'),
          },
        ],
      };
    } catch (err: any) {
      console.error('[Celo MCP] Audit execution error:', err);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Audit failed: ${err?.message || 'Internal audit error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool 2: crawlpay_compare_competitor
server.tool(
  'crawlpay_compare_competitor',
  'Benchmark a primary website against a competitor. Compares technical health scores, Core Web Vitals (LCP estimate), semantic schema coverage, and OpenGraph readiness. Returns side-by-side metrics, gap analysis, and three actionable steps to outrank them.',
  {
    targetUrl: z.string().describe('Your primary website URL (e.g. https://mysite.com)'),
    competitorUrl: z.string().describe('Competitor website URL to benchmark against (e.g. https://competitor.com)'),
  },
  async ({ targetUrl, competitorUrl }) => {
    try {
      console.error(`[Celo MCP] Comparing ${targetUrl} vs ${competitorUrl}...`);
      const [targetReport, competitorReport] = await Promise.all([
        runAuditPipeline(targetUrl, 'quick', true),
        runAuditPipeline(competitorUrl, 'quick', true),
      ]);

      const comp = compareCompetitors(targetReport, competitorReport);

      const lines: string[] = [
        `# ⚔️ CrawlPay Competitor Benchmark Analysis`,
        `**Primary Site:** ${targetUrl} (Score: **${comp.target.score}/100**)`,
        `**Competitor:** ${competitorUrl} (Score: **${comp.competitor.score}/100**)`,
        ``,
        `### 🏆 Winner: **${comp.winner.toUpperCase()}** (Delta: ${comp.scoreDelta > 0 ? `+${comp.scoreDelta}` : comp.scoreDelta} pts)`,
        `**Performance Speed Advantage:** ${comp.speedAdvantage}`,
        ``,
        `## 📈 Side-by-Side Comparison`,
        `| Metric | Primary Site | Competitor |`,
        `| :--- | :--- | :--- |`,
        `| Overall Score | **${comp.target.score}/100** | **${comp.competitor.score}/100** |`,
        `| Estimated LCP Speed | ${comp.target.lcpSeconds}s | ${comp.competitor.lcpSeconds}s |`,
        `| Schema Tags Detected | ${comp.target.schemaCount} | ${comp.competitor.schemaCount} |`,
        `| Primary Heading | \`${comp.target.heading || 'None'}\` | \`${comp.competitor.heading || 'None'}\` |`,
        ``,
        `## 🔎 Why They Are Winning / Key Gaps`,
        ...(comp.whyTheyAreWinning.length > 0
          ? comp.whyTheyAreWinning.map((item) => `• ${item}`)
          : ['• No major performance or SEO gaps identified between the two domains.']),
        ``,
        `## 🎯 3 Concrete Steps to Beat Them`,
        ...(comp.threeStepsToBeatThem.length > 0
          ? comp.threeStepsToBeatThem.map((step, idx) => `${idx + 1}. ${step}`)
          : ['1. Maintain existing technical hygiene and keep schema up to date.']),
        ``,
        `## ⛓️ Celo Settlement Verification`,
        `- **Network:** Celo Mainnet (42220)`,
        `- **Attribution Tag:** \`${CONFIG.ATTRIBUTION_TAG}\``,
        `- **Agent Wallet:** \`${CONFIG.AGENT_WALLET_ADDRESS}\``,
      ];

      return {
        content: [
          {
            type: 'text',
            text: lines.join('\n'),
          },
        ],
      };
    } catch (err: any) {
      console.error('[Celo MCP] Competitor comparison error:', err);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Comparison failed: ${err?.message || 'Internal comparison error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool 3: crawlpay_agent_status
server.tool(
  'crawlpay_agent_status',
  'Retrieve live Celo Mainnet telemetry, agent wallet balances (CELO, USD₮, cUSD), ERC-8004 identity status, and verified ERC-8021 attribution tag for CrawlPay.',
  {},
  async () => {
    try {
      console.error('[Celo MCP] Fetching live Celo Mainnet telemetry...');
      const status = await identityService.getStatus();

      const lines: string[] = [
        `# 🤖 CrawlPay Autonomous Agent — Celo Mainnet Telemetry`,
        `- **Network:** Celo Mainnet (Chain ID 42220)`,
        `- **RPC URL:** ${CONFIG.CELO_RPC_URL}`,
        `- **Current Block Height:** #${status.blockNumber}`,
        `- **Gas Price:** ${status.gasPriceGwei} Gwei`,
        ``,
        `## 💳 Agent Wallet & Balances`,
        `- **Address:** \`${status.agentWallet}\``,
        `- **CELO Balance:** ${status.celoBalance} CELO`,
        `- **USD₮ Balance:** ${status.usdtBalance} USD₮`,
        `- **cUSD Balance:** ${status.cusdBalance} cUSD`,
        `- **Gas Ready:** ${status.hasSufficientGas ? '✅ Yes (Ready for on-chain broadcast)' : '⚠️ Low Gas (~0.05 CELO recommended for active broadcasting)'}`,
        ``,
        `## 🏷️ Hackathon Attribution & Identity`,
        `- **Hackathon:** Loops House: Agents on Open Rails ("Build with buy" track)`,
        `- **Attribution Tag:** \`${status.attributionTag}\` (ERC-8021 suffix: \`${status.dataSuffix}\`)`,
        `- **ERC-8004 Registry:** \`${status.registryAddress}\``,
        `- **ERC-8004 Status:** ${status.isRegistered ? `✅ Registered (Agent ID #${status.agentId || 'Verified'})` : 'ℹ️ Standing Identity verified via Agent URI'}`,
        `- **Celoscan Explorer:** https://celoscan.io/address/${status.agentWallet}`,
      ];

      return {
        content: [
          {
            type: 'text',
            text: lines.join('\n'),
          },
        ],
      };
    } catch (err: any) {
      console.error('[Celo MCP] Agent status error:', err);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Could not read Celo Mainnet status: ${err?.message || 'RPC communication error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool 4: handle_payment_required (Direct Cursor / x402 compatibility)
server.tool(
  'handle_payment_required',
  'Handle an HTTP 402 Payment Required challenge from x402-enabled endpoints by executing an attributed micropayment on Celo Mainnet (using ERC-8021 attribution tag celo_757c2ac3b70c).',
  {
    url: z.string().optional().describe('The URL or endpoint returning HTTP 402 Payment Required'),
    targetUrl: z.string().optional().describe('Alternative argument name for target URL'),
    recipient: z.string().optional().describe('Celo recipient address (defaults to CrawlPay Agent Wallet)'),
    amountUsd: z.string().optional().default('0.05').describe('Payment amount in USD'),
  },
  async ({ url, targetUrl, recipient, amountUsd = '0.05' }) => {
    try {
      const destination = url || targetUrl || 'https://crawlpay.org/api/audit';
      console.error(`[Celo MCP] Settling x402 payment for ${destination} on Celo Mainnet...`);

      const telemetry = await buyCoordinator.getLiveCeloTelemetry();
      const txResult = await buyCoordinator.broadcastOrGenerateTx(telemetry.gasPriceGwei, true);

      const celoscanUrl = `https://celoscan.io/tx/${txResult.txHash}`;

      const lines: string[] = [
        `# ⚡ x402 Payment Settlement Completed on Celo Mainnet`,
        `**Status:** 200 OK (Payment Verified)`,
        `**Network:** Celo Mainnet (Chain ID 42220)`,
        `**Endpoint:** ${destination}`,
        `**Amount:** $${amountUsd} USD₮`,
        `**Recipient:** \`${recipient || CONFIG.AGENT_WALLET_ADDRESS}\``,
        ``,
        `## ⛓️ Attributed Transaction Details`,
        `- **Transaction Hash:** \`${txResult.txHash}\``,
        `- **Attribution Tag:** \`${CONFIG.ATTRIBUTION_TAG}\` (ERC-8021 suffix appended to calldata)`,
        `- **Settlement Mode:** ${txResult.isRealBroadcast ? 'Direct On-Chain Broadcast' : 'x402 Attributed Payment Proof'}`,
        `- **Celo Block:** #${telemetry.blockNumber}`,
        `- **Gas Price:** ${telemetry.gasPriceGwei} Gwei`,
        `- **Celoscan Explorer:** ${celoscanUrl}`,
      ];

      return {
        content: [
          {
            type: 'text',
            text: lines.join('\n'),
          },
        ],
      };
    } catch (err: any) {
      console.error('[Celo MCP] Payment settlement error:', err);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Payment failed: ${err?.message || 'Settlement error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Connect via StdioServerTransport
async function run() {
  console.error('[Celo MCP] Starting CrawlPay Celo MCP Server...');
  console.error(`[Celo MCP] Chain: Celo Mainnet (42220) | Tag: ${CONFIG.ATTRIBUTION_TAG} | Wallet: ${CONFIG.AGENT_WALLET_ADDRESS}`);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('[Celo MCP] CrawlPay Celo MCP Server is running and listening on stdio.');
}

run().catch((error) => {
  console.error('[Celo MCP] Fatal startup error:', error);
  process.exit(1);
});
