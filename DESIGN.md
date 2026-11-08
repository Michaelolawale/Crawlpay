# CrawlPay design guide

Read this fully before changing any page or component. The reference pages are the redesigned landing page (`src/app/page.tsx`) and the audit page (`src/app/app/audit/page.tsx`). When this guide and an older page disagree, this guide wins.

## What CrawlPay is

A site audit for Google and AI search. Free quick audit (one page). Deep crawl is $0.50 in USDT on Celo (up to 50 pages). No subscription. It also works through an MCP connector and API, so AI assistants can run it.

**Audience, in order:** freelancers and agencies who send reports to clients, developers and founders checking their own site, AI agent builders. Not big marketing teams. Most visitors are not technical, so the interface speaks plain English.

## Voice and wording

- Plain, direct, sentence case. Active verbs. Say what happens: "Run free audit", not "Submit".
- Name things by what the user understands. Technical terms belong in the docs and in expandable code drawers, not in headings or buttons.
- Errors say what went wrong and what to do next. They never blame the user or apologize.
- Never claim anything about other tools, their prices, or their data.
- Never promise rankings or AI citations. Use what CrawlPay finds 

| Use | Do not use |
|---|---|
| Quick audit, Deep crawl | Full Deep Crawl, Deep Sitewide Crawl, Quick Single-Page Audit |
| Run free audit | Launch CrawlPay, Audit Your Site, Launch Engine |
| Sample report | Verified Demo Preview |
| Saved reports | Reports Archive |
| Connect to Claude | MCP Agent Setup (on marketing pages) |
| Refund policy | Refund Guarantee Policy |
| pay in USDT | USDT / USDC / CELO (only USDT works) |
| unknown | n/a, N/A, guessed values |

Banned on marketing and app pages: "Deterministic", "BFS crawl", "SSRF", "DOM", "autonomous", "micro-settlement", "root cause grouping", "leapfrog". Do not use another company's brand as a feature name (for example AnswerThePublic).

## Tokens (use existing ones only)

Do not add colors, fonts or shadows. Use these Tailwind tokens already in the project.

- **Text and brand:** `ink` (primary text and primary buttons), `violet` (links and selected states), `lavender-panel` (one featured panel per page at most).
- **Neutrals:** `graphite-100` to `graphite-900`. Body text `graphite-800`, secondary `graphite-700`. Dark mode secondary `graphite-300`.
- **Surfaces, light:** `white`, and `#f4f4f6` for tinted bands and form panels.
- **Surfaces, dark:** page `#0d0e12`, header and bands `#121317`, cards `#16171d`, raised `#1a1b22`. Borders `graphite-800`.
- **Fonts:** `font-sans` for everything, `font-footer` only in the footer. Mono only for real code, addresses and hashes, never for decorative labels.
- **Shadow:** `shadow-screenshot-inset` on sample or preview cards only.
- Every surface needs a `dark:` variant.

## Layout

- Page container `max-w-[1176px] mx-auto px-4 sm:px-6`. App pages use a single column, `max-w-[880px]`.
- Section spacing: `py-[48px] sm:py-[80px]` for major sections, `py-[40px] sm:py-[56px]` for light ones.
- Left-align text and headings. Center only short standalone calls to action.
- Line length stays under about 62 characters (`max-w-[52ch]` to `max-w-[62ch]`).
- One strong element per page. The landing page hero shows a real-looking finding next to the headline. Keep everything around the memorable element quiet.

## Type scale

| Role | Size and weight |
|---|---|
| Page title (h1) | 34 / 48 / 56 px, weight 600, line-height 1.1 |
| Section title (h2) | 28 / 38 px, weight 600, line-height 1.15 |
| Subsection (h3) | 18 to 20 px, weight 600 |
| Body | 15 to 16 px, line-height 1.6 |
| Small | 13 to 14 px. Nothing under 13 px |

## Components

- **Buttons:** pill, `rounded-[48px]`. Primary is `bg-ink text-white` (inverted in dark mode). Secondary is an outline. One primary button per section.
- **Inputs:** `rounded-[32px]`, `border border-ink`, text 16 px so mobile does not zoom. Every input has a real `<label>` (use `sr-only` only when a visible label would repeat the heading).
- **Cards and panels:** `rounded-[16px]` or `rounded-[20px]`. Do not make everything a card. Use spacing and a top rule to group content when no container is needed.
- **Choice cards:** use native radio inputs (`sr-only peer`) so keyboard and screen readers work. Never `role="button"` divs.
- **Accordions:** a `button` with `aria-expanded` and `aria-controls`.
- **Focus ring (required on every interactive element):**
  `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet`
- **Severity badges:** Critical (red), Warning (amber), Unknown (graphite). Text plus color, never color alone.
- Extract shared pieces instead of copying them: `SiteHeader`, `SiteFooter`, a `focusRing` constant, a `Button` component, `SeverityBadge`. Every page uses the same header and footer.

## Things to avoid

- Uppercase tracked labels, small mono data labels, an eyebrow above every heading, middle-dot strings (`A · B · C`).
- Numbered markers unless the content is a real sequence (the three audit steps are).
- Gradients, decorative blobs, hover lifts on every card, scroll entrance animations. Motion only answers a user action (opening, expanding, confirming). Respect `prefers-reduced-motion`.
- The one decorative element is the landing page hero background (`src/components/HeroBackground.tsx`): a static, low-contrast site map. Keep it as is. Do not replace it with gradients or add decorative backgrounds to other sections or pages.
- Blurred or locked content. The free audit is complete for the page it covers. Paid features are about depth (multi-page crawl, cross-page issues, saved history, comparison, PDF, onchain receipt), never hiding a finding that was already computed.
- Fabricated numbers. No search volume, difficulty, cost per click, traffic, or default scores. If a value is missing it is `null` in data and "unknown" in the interface, with the reason.
- Arrow icons on links: at most one per section, only for links to another page.

## Report and result screens (`CheckEngineView`, `/example`, `/app/reports`)

Each finding shows, in this order:
1. A plain-English title and a one-line reason it matters for the business.
2. The evidence: the exact rule, line, URL or element behind it.
3. The fix, with a copy button. Framework code (Next.js, WordPress, Shopify, plain HTML) lives in an expandable drawer.
4. A severity badge. Findings that could not be checked show "Unknown" with the reason (for example, "the speed service was busy"). A transient error such as an HTTP 429 must never appear as page content.

Also: keep a stable issue code in the data for agents (not necessarily on screen). Show a score only if its formula is defined, and never show a perfect score next to open issues. Counts must agree across the page (pages crawled, pages affected, issues listed). The sample report is a frozen file generated from a real audit, reviewed by hand, and covered by a test that checks these rules.

## Money and trust copy

- Quick audit: free, one page, fair-use limit of 5 per hour.
- Deep crawl: $0.50, up to 50 pages, paid in USDT on Celo. List only features that ship.
- A failed paid audit is never charged. The refund policy page has a monitored support address.
- If a "live proof" counter is shown, it says exactly what it counts (for example "onchain transactions").

## Page-by-page

| Page | What to apply |
|---|---|
| `/app/reports` | Title "Saved reports". Say reports are kept in this browser. Handle `overallScore: null` (show "No score"). |
| `/example` | Serve a frozen report to every visitor, no stored state needed, works in a private window. No error text. Numbers agree with the landing page sample. |
| `/docs` | Technical terms are allowed here. Needs working `#mcp` and `#api` anchors. Document every public endpoint or remove it. The status endpoint returns only status and version. |
| `/terms` | Refund section has a real contact. Anchors `#about`, `#refund`, `#security` exist. |
| `PaymentModal` | USDT only. Plain step names. Failure states say what happened and that nothing was charged. |
| `CheckEngineView` | Report rules above. Remove blur gating and any competitor or brand-name labels. |
| Shared header and footer | One component each, same nav labels as the landing page. |

## Accessibility floor

Visible focus on every control, labels on every input, `aria-live` for loading and error areas, 4.5:1 text contrast in both themes, tap targets at least 40 px, keyboard-operable everything, reduced-motion respected, no information carried by color alone.

## How to work

1. Change presentation and copy only. Do not touch payment, settlement, crawling, or API logic unless the task says so.
2. Reuse the shared components and existing tokens. Do not introduce new ones.
3. After each page: run `tsc --noEmit` and the tests, then list any place you deviated from this guide and why.
4. One page per task. Wait for review before starting the next.
