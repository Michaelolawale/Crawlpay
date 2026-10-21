# CrawlPay 🕷️⚡

> **Autonomous On-Demand Technical SEO & Competitor Intelligence on Celo Mainnet**  
> *Submitted to the [Agents on Open Rails Hackathon](https://www.loops.house/agents-on-open-rails) · Track: **Build with buy***

---

## 📌 Executive Summary

Modern AI agents and webmasters face a major problem with SEO & market intelligence:
1. **Expensive Subscriptions:** Legacy platforms (Ahrefs, Semrush, Screaming Frog) demand **$99–$249 every month** via credit cards, regardless of whether you run 1 audit or 50.
2. **Generic Canned Audits:** Existing free tools spit out surface-level character-count rules without understanding the actual business archetype (e.g. treating an e-commerce store the same as a B2B SaaS).
3. **No Machine Payment Rails:** Autonomous agents cannot sign up for recurring SaaS subscriptions or solve CAPTCHAs.

**CrawlPay** is an autonomous economic agent built on Celo Mainnet that replaces rigid monthly subscriptions with **on-demand, granular pay-per-crawl audits** settled over **HTTP 402**.

---

## ⚡ Core Features

- **🛒 Smart Site Archetype Classifier:** Automatically detects if a site is **E-Commerce**, **B2B / SaaS**, **Local Business**, **Publisher**, or **Web3 / DApp**, and customizes the audit criteria to match reality.
- **🧠 Semantic H1 & Keyword Auditor:** Flags vague corporate jargon (e.g., *"The Future of Digital Productivity"*) and recommends high-intent, keyword-rich headings that Google rewards.
- **⚔️ Head-to-Head Competitor Battle:** Compares your site against a direct competitor, analyzes speed differences (LCP/Core Web Vitals), and produces a *"Why They Are Winning"* roadmap with 3 immediate action steps.
- **🛠️ Auto-Generated Copy-Paste Code Patches:** Produces ready-to-paste snippets for **Next.js 14/15 App Router**, **Shopify Liquid**, **HTML5 `<head>`**, and custom **Schema.org JSON-LD**.
- **🧾 Verified Onchain Receipt:** Every audit logs upstream payments to rented browsers and social endpoints via `buy` on Celo Mainnet with direct Celoscan transaction proof.

---

## 🔗 Celo Mainnet Details

| Parameter | Value |
| :--- | :--- |
| **Network** | Celo Mainnet (`chainId: 42220`) |
| **Attribution Tag** | `celo_757c2ac3b70c` (ERC-8021) |
| **Data Suffix** | `0x63656c6f5f373537633261633362373063110080218021802180218021802180218021` |
| **Agent Wallet** | `0xf06c2b754d07cba299751f0985a48f8013bb6b39` |
| **Identity Registry** | ERC-8004 (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`) |
| **Upstream Gateway** | `gateway.usebuy.ai` (x402 Facilitator) |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    User[End User / AI Agent] -->|1. Triggers Audit ($0.25 USD₮ via x402)| CP[CrawlPay Core Server]

    subgraph Upstream Paid x402 Rails [Services Consumed via buy on Celo]
        CP -->|2. Rent Isolated Browser ($0.045)| BROWSER[Headless Browser Pool\nFull JS Render, Core Web Vitals]
        CP -->|3. Query Social Buzz ($0.020)| SOCIAL[Social Index API\nX & Reddit Mentions]
    end

    subgraph Intelligence Engine [Bespoke Analysis]
        BROWSER --> ENGINE[Archetype Classifier & Semantic Auditor]
        SOCIAL --> ENGINE
        ENGINE --> PATCH[Code Patch Generator\nNext.js, Shopify, Schema.org]
    end

    PATCH -->|4. Deliver Audit & Action Plan| User
    ENGINE -->|5. Settle Margin & Tag calldata| CELO[Celo Mainnet Ledger\ncelo_757c2ac3b70c]
```

---

## 🚀 Quick Start (Next.js 14 App Router)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Production Build & Deployment
```bash
npm run build
npm start
```
*Tip:* CrawlPay is now 100% compatible with **1-click Vercel deployment**! Just connect your GitHub repository to Vercel and it deploys automatically.

---

## 📡 API Endpoints & Machine Discovery

* `POST /api/audit`: Single site in-depth audit
* `POST /api/compare`: Head-to-head competitor audit
* `GET /api/status`: Agent wallet & Celo attribution metadata
* `GET /api/x402-bazaar`: HTTP 402 Machine-readable schema for agent-to-agent discovery on `8004scan.io` and `agent402.tools`.

---

## 📜 License
Apache-2.0
