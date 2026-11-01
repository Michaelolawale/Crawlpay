# CrawlPay 🕷️⚡

<p align="center">
  <img src="public/logo-dark.jpg" alt="CrawlPay Logo" width="128" style="border-radius: 28px;" />
</p>

> **Autonomous On-Demand Technical SEO, AEO/GEO & Competitor Intelligence on Celo Mainnet**  
> *Submitted to the [Agents on Open Rails Hackathon](https://www.loops.house/agents-on-open-rails) · Track: **Build with buy***

[![Celo Mainnet](https://img.shields.io/badge/Celo-Mainnet_42220-35D07F?style=flat-square&logo=celo)](https://celoscan.io/address/0xf06c2b754d07cba299751f0985a48f8013bb6b39)
[![Attribution Tag](https://img.shields.io/badge/ERC--8021-celo__757c2ac3b70c-6c5edc?style=flat-square)](https://celoscan.io/tx/0x969c357fb05affb728f5adf060ae1d7070f9af74577c49cbd08c63c9cf554916)
[![ERC-8004 Identity](https://img.shields.io/badge/ERC--8004_Agent-ID_%239984-blue?style=flat-square)](https://8004scan.io/)
[![HTTP 402 Powered](https://img.shields.io/badge/buy-x402_Micropayments-black?style=flat-square)](https://usebuy.ai/)

---

## 📌 Executive Summary

Modern webmasters, indie hackers, and autonomous AI agents face severe friction with existing SEO & market intelligence tooling:
1. **Predatory Recurring Subscriptions:** Legacy platforms (Ahrefs, Semrush, Screaming Frog) demand **$99–$249 every month** via credit cards, regardless of whether a user runs 1 audit or 50.
2. **Generic Canned Audits:** Existing tools spit out naive character-count warnings without understanding the actual business archetype (e.g. treating an e-commerce catalog the same as an indie B2B SaaS or Web3 directory).
3. **The Rise of AI Search (AEO & GEO):** Traditional SEO ignores LLM search engines. Websites lose traffic to Perplexity, SearchGPT, Claude, and Gemini because they lack `/llms.txt`, direct answer readiness, and RFC 9309 crawler permissions.
4. **No Machine Payment Rails:** Autonomous software agents cannot submit recurring credit cards or solve CAPTCHAs.

**CrawlPay** is an autonomous economic agent built on Celo Mainnet that replaces rigid monthly subscriptions with **on-demand, granular pay-per-crawl audits** settled over **HTTP 402** via `@celo/buy`.

---

## 👤 Target User & Before/After Cost Story

* **Named User:** **Mateo Rossi**, Founder & Lead Developer at **CeloPulse** (`celopulse.org` — an indie Web3 directory and developer resource portal).
* **What it costs Mateo today (Before CrawlPay):**
  * Mateo audits his directory listings and dApp submissions for Core Web Vitals, metadata, canonical chains, AI bot access, and mobile layout shifts.
  * Today, legacy platforms (Semrush Pro at **$139.95/mo** + Screaming Frog license at **~$21.50/mo**) charge him **~$161.45 every month on a recurring credit card**, even though he only audits 8–10 pages per month.
  * Effective cost per audit: **~$16–$20 per audit**, tied to a locked-in monthly subscription that charges him even when idle.
* **What changed (After CrawlPay):**
  * Mateo connects his wallet to CrawlPay or triggers the audit programmatically via x402.
  * When deploying a release, he triggers an on-demand audit paying **$0.25 USD₮** settled directly over HTTP 402 on Celo Mainnet.
  * His monthly SEO cost dropped from **$161.45/month to $2.50/month (a 98.5% cost reduction)**.
  * Zero credit cards, zero recurring lock-in, and instant copy-paste code patches tailored to his Next.js 14 App Router codebase.

---

## ⚡ Core Capabilities

### 1. 🤖 Answer Engine (AEO) & Generative Search (GEO) Auditor
- **Direct Answer Readiness:** Evaluates content structure against LLM knowledge synthesis standards (Perplexity, SearchGPT, Claude, Gemini, Google AI Overviews).
- **RFC 9309 AI Bot Matrix:** Deterministic longest-match evaluation of `robots.txt` permissions for `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, and `CCBot`.
- **Entity Grounding & `/llms.txt`:** Checks for declared Wikidata/Wikipedia `sameAs` entity links and validates AI crawler documentation paths.

### 2. 📊 Responsive Visual Telemetry & Benchmark Charts
- **DOM Paint Completion Curve:** Real mathematical cumulative S-curve plotting Time to First Byte (TTFB), First Contentful Paint (FCP), DOM Interactive, and Largest Contentful Paint (LCP) against Google's 2.5s standard.
- **Mobile-First Layout:** Dual-mode adaptive architecture:
  - **Mobile (<640px):** 1.4:1 aspect-ratio SVG with 60fps touch-scrubbing (live millisecond HUD) + full-width Comparative Pillar Cards with dual progress bars and delta indicators.
  - **Desktop (sm+):** Calibrated 800px SVG curves and 6-column grouped bar charts with interactive drawer.

### 3. 📂 Google Search Console (GSC) Upload & Gap Ingestion
- Upload GSC exports (`.csv`, `.tsv`, `.json`, `.zip`) directly into CrawlPay.
- Instantly isolates coverage gaps: unindexed URLs, soft 404s, "Discovered – currently not indexed", and generates immediate remedial actions.

### 4. 📱 Mobile-First Indexing Telemetry (375px–414px)
- Deterministic checks for viewport meta configuration, 48px touch tap targets, aspect-ratio cumulative layout shifts (CLS), and simulated 4G mobile LCP.

### 5. ⚔️ Head-to-Head Competitor Intelligence
- Benchmarks your site against any direct rival URL.
- Highlights speed differences, schema tag disparity, and produces a *"Why They Are Winning"* breakdown with 3 immediate leapfrog action steps.

### 6. 🛠️ Stack-Tailored Copy-Paste Code Patches
- Automatically detects the target CMS / framework (**Next.js 14/15 App Router**, **Shopify Liquid**, **WordPress**, **HTML5**).
- Produces pre-formatted, drop-in code fixes and valid **Schema.org JSON-LD** tags.

### 7. 📄 Shareable & Printable Reports
- Persistent report viewer with one-click JSON export and clean print-to-PDF formatting.
- Live interactive demo preview available at `/example`.

---

## 🔗 Celo Mainnet & Onchain Verification

Every audit executed through CrawlPay settles on **Celo Mainnet** with ERC-8021 calldata attribution:

| Parameter | Value |
| :--- | :--- |
| **Network** | Celo Mainnet (`chainId: 42220`) |
| **Attribution Tag** | `celo_757c2ac3b70c` (ERC-8021) |
| **Data Suffix** | `0x63656c6f5f373537633261633362373063110080218021802180218021802180218021` |
| **Agent Wallet** | `0xf06c2b754d07cba299751f0985a48f8013bb6b39` |
| **ERC-8004 Identity** | `#9984` at `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| **Upstream x402 Rails** | `@celo/buy` & `gateway.usebuy.ai` (x402 Facilitator) |
| **First Attributed Tx** | [`0x969c357...4916`](https://celoscan.io/tx/0x969c357fb05affb728f5adf060ae1d7070f9af74577c49cbd08c63c9cf554916) (Block #80678127) |
| **Registration Tx** | [`0xc98affb...bab7`](https://celoscan.io/tx/0xc98affbf890764b6cc4483a414bb3163265747db32c6d39cb1cdae7669f9bab7) (Agent ID #9984) |

---

## 🏗️ Technical Architecture

```mermaid
flowchart TD
    User[End User / Autonomous AI Agent] -->|1. Triggers Audit ($0.25 USD₮ via HTTP 402)| CP[CrawlPay Core Agent Engine]

    subgraph Upstream Paid x402 Rails [Services Consumed via buy on Celo]
        CP -->|2. Rent Isolated Browser ($0.045)| BROWSER[Headless Browser Pool\nFull JS Render & DOM Telemetry]
        CP -->|3. Query Social Sentiment ($0.020)| SOCIAL[Social Index API\nX & Reddit Mentions]
    end

    subgraph Analysis & Synthesis Engine
        BROWSER --> PARSER[SEO, AEO & GEO Evaluator]
        SOCIAL --> PARSER
        PARSER --> CHARTS[Mathematical Paint Curves & Pillar Benchmarks]
        PARSER --> PATCHES[Stack Code Patch Generator\nNext.js, Shopify, Schema.org]
    end

    CHARTS -->|4. Interactive Telemetry Report| User
    PATCHES -->|4. Copy-Paste Code Fixes| User
    CP -->|5. Tag calldata & Settle Margin| CELO[Celo Mainnet Ledger\ncelo_757c2ac3b70c]
```

---

## 📁 Repository Structure

```
crawlpay/
├── src/
│   ├── app/                      # Next.js 14 App Router pages & API routes
│   │   ├── admin/                # Admin operations (abuse, jobs, payments, sandbox)
│   │   ├── app/                  # Main application workspace
│   │   │   ├── audit/            # URL audit launcher & GSC file upload
│   │   │   └── reports/[id]/     # Persistent, shareable audit report viewer
│   │   ├── example/              # Interactive demo preview report
│   │   ├── api/                  # Backend endpoints (audit, compare, reports, x402)
│   │   └── page.tsx              # Landing page & feature showcase
│   ├── components/               # React UI components
│   │   ├── CheckEngineView.tsx   # Command center, findings explorer, patch viewer
│   │   ├── OverviewAuditGraph.tsx# Responsive telemetry charts & DOM paint curves
│   │   └── PaymentModal.tsx      # x402 settlement modal with QR & wallet support
│   ├── engine/                   # Core deterministic SEO & AEO/GEO engine
│   │   ├── checks/               # AEO, GEO, links, mobile, performance, schemas
│   │   └── utils/                # Stack detector (Next.js, Shopify, WordPress)
│   ├── services/                 # Upstream client integrations (@celo/buy)
│   └── types/                    # TypeScript interfaces for audits & comparisons
├── public/                       # Logos, brand assets, and icons
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm

### 2. Installation
```bash
git clone https://github.com/your-username/crawlpay.git
cd crawlpay
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
AGENT_PRIVATE_KEY=your_celo_private_key_here
NEXT_PUBLIC_FACILITATOR_URL=https://gateway.usebuy.ai
```

### 4. Run Development Server
```bash
npm run dev
```
Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📡 Machine-Readable Discovery & API Endpoints

Autonomous agents can discover and call CrawlPay endpoints without human intervention:

* `POST /api/audit`: Trigger single-site audit (`{ targetUrl, depth: 'quick' | 'full' }`)
* `POST /api/compare`: Head-to-head competitor analysis (`{ targetUrl, competitorUrl }`)
* `GET /api/reports/:id`: Retrieve stored audit report JSON
* `GET /api/status`: Agent wallet balance, uptime, and Celo attribution metadata
* `GET /api/x402-bazaar`: HTTP 402 Machine-readable schema compliant with `8004scan.io` and `agent402.tools`.

---

## 📜 License

Distributed under the **Apache-2.0** License. See `LICENSE` for details.
