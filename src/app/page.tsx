'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Check, Loader2 } from 'lucide-react';
import { LiveProofCounter } from '@/components/LiveProofCounter';
import { HeroBackground } from '@/components/HeroBackground';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { useConfig } from '@/context/ConfigContext';

const SUPPORT_TELEGRAM = 'https://t.me/Noble249';

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet';

const TERMS = [
  { term: 'SEO', name: 'Search engine optimization', text: 'Helping Google and Bing find, index and understand your pages.' },
  { term: 'AEO', name: 'Answer engine optimization', text: 'Writing pages that give clear, direct answers that search tools can pull from.' },
  { term: 'GEO', name: 'Generative engine optimization', text: 'Making your site readable and quotable by AI assistants like ChatGPT, Claude and Perplexity.' },
];

const STEPS = [
  { title: 'Paste your address', text: 'Any public page. The free audit needs no account, wallet or email.' },
  { title: 'See what is holding it back', text: 'A clear list ranked by what matters most, with the exact line or rule behind each problem.' },
  { title: 'Copy the fix', text: 'Paste-ready code for Next.js, WordPress, Shopify and plain HTML.' },
];

export default function LandingPage() {
  const router = useRouter();
  const { fullPriceFormatted, fullPriceRaw } = useConfig();
  const [heroUrl, setHeroUrl] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const plans = [
    {
      name: 'Quick audit',
      price: 'Free',
      note: 'One page, up to 5 per hour',
      features: [
        'Every problem found on the page, with its fix',
        'Search, AI-crawler and direct-answer checks',
        'Keyword and question ideas from your own content',
        'Copy-paste code fixes',
      ],
      cta: 'Run free audit',
      href: '/app/audit',
      featured: false,
    },
    {
      name: 'Deep crawl',
      price: fullPriceFormatted,
      note: 'Up to 50 pages, paid in USDT on Celo',
      features: [
        'Orphan pages, redirect chains and status errors across the site',
        'Duplicate titles and canonical clashes between pages',
        'Saved reports and before-and-after comparison',
        'Client-ready PDF and an onchain receipt',
      ],
      cta: 'Start a deep crawl',
      href: '/app/audit',
      featured: true,
    },
  ];

  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: 'What does CrawlPay check?',
      a: 'Whether Google can find and index the page, whether AI crawlers such as GPTBot, ClaudeBot and PerplexityBot are allowed in (and which robots.txt rule decides it), whether the page gives direct answers, and whether titles, headings, links and structured data are set up correctly. When it cannot tell, it says “unknown” instead of guessing.',
    },
    {
      q: 'Is the free audit really free?',
      a: 'Yes. A quick audit covers one page and shows every problem it finds, with fixes. There is a fair-use limit of 5 free audits per hour.',
    },
    {
      q: 'Do I need a wallet?',
      a: `Only for a deep crawl. Any EVM wallet connected to Celo works (MetaMask, Rabby, Valora, MiniPay, Coinbase Wallet), and you pay ${fullPriceFormatted} in USDT. There is no subscription.`,
    },
    {
      q: 'Can my AI assistant use it?',
      a: (
        <>
          Yes. Connect CrawlPay to Claude or another MCP client and ask “can search engines and AI assistants read my site?” It audits your live page instead of guessing. Developers can also call the API, and AI agents can pay per call with x402 on Celo. See the{' '}
          <Link href="/docs#mcp" className="underline hover:text-white">setup guide</Link>.
        </>
      ),
    },
    {
      q: 'Will fixing everything improve my rankings or get me cited by AI?',
      a: 'No tool can promise that. CrawlPay finds what blocks or confuses search engines and AI tools so you can fix it. It does not show keyword volumes, backlinks or live rankings; tools built for that cover those.',
    },
    {
      q: 'What if an audit fails?',
      a: (
        <>
          If a paid audit cannot finish, you are eligible for a refund. Message our official support operator on{' '}
          <a href={SUPPORT_TELEGRAM} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Telegram (@Noble249)</a>{' '}
          with your transaction hash. Full terms are in the{' '}
          <Link href="/terms#refund" className="underline hover:text-white">refund policy</Link>.
        </>
      ),
    },
  ];

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'CrawlPay',
      url: 'https://crawlpay.vercel.app',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      description: 'Autonomous technical SEO, AEO query mapping, and GEO generative citability audits—settled per crawl via x402 on Celo.',
      offers: [
        {
          '@type': 'Offer',
          name: 'Quick Audit',
          price: '0.00',
          priceCurrency: 'USD',
          description: 'Single-page audit covering technical SEO, AEO query directness, and GEO AI crawler accessibility with copy-paste code fixes.',
        },
        {
          '@type': 'Offer',
          name: 'Deep Crawl',
          price: fullPriceRaw,
          priceCurrency: 'USD',
          description: 'Multi-page deep crawl up to 50 pages, orphan page detection, redirect chains, and client-ready reports settled onchain via x402 on Celo.',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What does CrawlPay check?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Whether Google can find and index the page, whether AI crawlers such as GPTBot, ClaudeBot and PerplexityBot are allowed in (and which robots.txt rule decides it), whether the page gives direct answers, and whether titles, headings, links and structured data are set up correctly. When it cannot tell, it says “unknown” instead of guessing.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is the free audit really free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. A quick audit covers one page and shows every problem it finds, with fixes. There is a fair-use limit of 5 free audits per hour.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need a wallet?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Only for a deep crawl. Any EVM wallet connected to Celo works (MetaMask, Rabby, Valora, MiniPay, Coinbase Wallet), and you pay ${fullPriceFormatted} in USDT. There is no subscription.`,
          },
        },
        {
          '@type': 'Question',
          name: 'Can my AI assistant use it?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Connect CrawlPay to Claude or another MCP client and ask “can search engines and AI assistants read my site?” It audits your live page instead of guessing. Developers can also call the API, and AI agents can pay per call with x402 on Celo.',
          },
        },
        {
          '@type': 'Question',
          name: 'Will fixing everything improve my rankings or get me cited by AI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No tool can promise that. CrawlPay finds what blocks or confuses search engines and AI tools so you can fix it. It does not show keyword volumes, backlinks or live rankings; tools built for that cover those.',
          },
        },
        {
          '@type': 'Question',
          name: 'What if an audit fails?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'If a paid audit cannot finish, you are eligible for a refund. Message our official support operator on Telegram (@Noble249) with your transaction hash.',
          },
        },
      ],
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const target = heroUrl.trim();
    router.push(target ? `/app/audit?target=${encodeURIComponent(target)}` : '/app/audit');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0e12] text-ink dark:text-white font-system overflow-x-hidden transition-colors">
      <SiteHeader />

      <main>
        {/* Structured Data (JSON-LD) for SEO, AEO & GEO rich results */}
        {structuredData.map((schema, idx) => (
          <script
            key={idx}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}

        {/* HERO: centered text section */}
        <section className="relative overflow-hidden bg-[#f4f4f6] dark:bg-[#121317] border-b border-graphite-100 dark:border-graphite-800 py-[64px] sm:py-[96px]">
          <HeroBackground />
          <div className="relative z-10 max-w-[800px] mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
            <div className="mb-5">
              <LiveProofCounter variant="badge" />
            </div>
            <h1 className="font-sans text-[34px] sm:text-[48px] lg:text-[56px] font-[600] leading-[1.1] tracking-tight max-w-[720px]">
              Can Google and AI search actually read your website?
            </h1>
            <p className="text-[16px] sm:text-[18px] leading-[1.6] text-graphite-800 dark:text-graphite-200 max-w-[580px] mt-5">
              CrawlPay checks your site the way search engines and AI tools see it, then gives you the exact fix for every problem it finds.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 w-full max-w-[560px]">
              <label htmlFor="hero-url" className="sr-only">Website address</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="hero-url"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  value={heroUrl}
                  onChange={(e) => setHeroUrl(e.target.value)}
                  placeholder="yoursite.com"
                  className={`w-full bg-white text-ink border border-ink rounded-[32px] px-5 py-3 text-[16px] placeholder:text-graphite-600 ${focus}`}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className={`shrink-0 bg-ink text-white rounded-[48px] px-7 py-3 text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:bg-ink/90 active:scale-[0.98] transition disabled:opacity-75 dark:bg-white dark:text-ink ${focus}`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Starting audit</span>
                    </>
                  ) : (
                    <span>Run free audit</span>
                  )}
                </button>
              </div>
              <p className="mt-3 text-[14px] text-graphite-700 dark:text-graphite-300">
                No account, wallet or email needed.
              </p>
            </form>
          </div>
        </section>

        {/* TERMS */}
        <section aria-labelledby="terms-heading" className="py-[48px] sm:py-[72px]">
          <div className="max-w-[1176px] mx-auto px-4 sm:px-6">
            <h2 id="terms-heading" className="font-sans text-[26px] sm:text-[34px] font-[600] leading-[1.18] tracking-tight">
              The three ways search works today
            </h2>
            <p className="text-[16px] leading-[1.6] text-graphite-800 dark:text-graphite-200 mt-3 max-w-[560px]">
              Search engines, direct-answer boxes, and AI assistants each inspect your pages differently.
            </p>
            <div className="mt-8 sm:mt-10 grid md:grid-cols-3 gap-5 sm:gap-6">
              {TERMS.map((t) => (
                <div
                  key={t.term}
                  className="rounded-[20px] bg-[#f4f4f6] dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-800 p-6 sm:p-7 flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[13px] font-semibold bg-white dark:bg-[#121317] border border-graphite-200 dark:border-graphite-700 text-ink dark:text-white">
                      {t.term}
                    </span>
                    <h3 className="font-sans font-[600] text-[18px] sm:text-[19px] leading-snug mt-4">
                      {t.name}
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-graphite-800 dark:text-graphite-200 mt-2">
                      {t.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="scroll-mt-20 sm:scroll-mt-24 border-t border-graphite-100 dark:border-graphite-800 py-[48px] sm:py-[72px]">
          <div className="max-w-[1176px] mx-auto px-4 sm:px-6">
            <h2 className="font-sans text-[28px] sm:text-[38px] font-[600] leading-[1.15] tracking-tight max-w-[640px]">
              From address to fix in a few minutes
            </h2>
            <ol className="mt-10 grid md:grid-cols-3 gap-6 sm:gap-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="border-t-2 border-ink dark:border-white pt-4">
                  <span className="font-sans text-[15px] font-[600] text-graphite-600 dark:text-graphite-300">Step {i + 1}</span>
                  <h3 className="font-sans font-[600] text-[20px] leading-[1.3] mt-1">{s.title}</h3>
                  <p className="text-[15px] leading-[1.6] text-graphite-800 dark:text-graphite-200 mt-2 max-w-[38ch]">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="scroll-mt-20 sm:scroll-mt-24 bg-[#f4f4f6] dark:bg-[#121317] border-y border-graphite-100 dark:border-graphite-800 py-[48px] sm:py-[80px]">
          <div className="max-w-[1176px] mx-auto px-4 sm:px-6">
            <h2 className="font-sans text-[28px] sm:text-[38px] font-[600] leading-[1.15] tracking-tight max-w-[640px]">
              Free to try. Pay only when you go deeper.
            </h2>
            <p className="text-[16px] leading-[1.6] text-graphite-800 dark:text-graphite-200 mt-3 max-w-[560px]">
              No subscription. You pay per deep crawl, so you only spend when you audit.
            </p>

            <div className="mt-10 grid md:grid-cols-2 gap-5 sm:gap-6 max-w-[900px]">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={`rounded-[20px] p-6 sm:p-7 flex flex-col ${
                    p.featured ? 'bg-lavender-panel text-ink' : 'bg-white dark:bg-[#16171d] border border-graphite-100 dark:border-graphite-800'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-sans font-[600] text-[20px]">{p.name}</h3>
                    <span className="font-sans font-[600] text-[28px]" suppressHydrationWarning>{p.price}</span>
                  </div>
                  <p className="text-[14px] mt-1 opacity-80">{p.note}</p>
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-[15px] leading-snug">
                        <Check className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.href}
                    className={`mt-7 inline-flex justify-center rounded-[48px] px-6 py-2.5 text-[14px] font-medium transition-opacity hover:opacity-90 ${focus} ${
                      p.featured ? 'bg-ink text-white' : 'bg-ink text-white dark:bg-white dark:text-ink'
                    }`}
                  >
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AGENTS AND DEVELOPERS */}
        <section className="py-[48px] sm:py-[80px]">
          <div className="max-w-[1176px] mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <div>
              <h2 className="font-sans text-[26px] sm:text-[34px] lg:text-[38px] font-[600] leading-[1.18] tracking-tight">
                Your AI assistant can run it for you
              </h2>
              <p className="text-[16px] leading-[1.6] text-graphite-800 dark:text-graphite-200 mt-4 max-w-[52ch]">
                Connect CrawlPay to Claude or any MCP client and ask “can search engines and AI assistants read my site?” The assistant audits your live page with CrawlPay and explains the fixes directly in chat, instead of guessing. Developers get structured JSON results with stable issue codes, and AI agents can pay per call automatically with x402 on Celo.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/docs#mcp"
                  className={`inline-flex justify-center bg-ink dark:bg-white text-white dark:text-ink rounded-[48px] px-6 py-2.5 text-[14px] font-medium hover:opacity-90 ${focus}`}
                >
                  Connect to Claude
                </Link>
                <Link
                  href="/docs#api"
                  className={`inline-flex justify-center rounded-[48px] px-6 py-2.5 text-[14px] font-medium border border-ink dark:border-white hover:bg-graphite-100 dark:hover:bg-graphite-800 ${focus}`}
                >
                  Read the API docs
                </Link>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[20px] bg-[#f4f4f6] dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-800 p-6">
                <h3 className="font-sans font-[600] text-[18px]">Who it is for</h3>
                <p className="text-[15px] leading-[1.6] text-graphite-800 dark:text-graphite-200 mt-2">
                  Freelancers and agencies who need a clear, client-ready report. Developers and founders verifying that a site is ready for search and AI crawlers. Anyone who wants answers for their specific site, not an expensive monthly subscription.
                </p>
              </div>
              <div className="rounded-[20px] bg-[#f4f4f6] dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-800 p-6">
                <h3 className="font-sans font-[600] text-[18px]">What it does not do</h3>
                <p className="text-[15px] leading-[1.6] text-graphite-800 dark:text-graphite-200 mt-2">
                  CrawlPay does not track global backlink databases or estimate keyword search volumes. Instead of guessing third-party metrics, it extracts keyword and question ideas directly from your page content and verifies whether search engines and AI assistants can actually read your code.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 sm:scroll-mt-24 bg-ink py-[48px] sm:py-[80px]">
          <div className="max-w-[760px] mx-auto px-4 sm:px-6 text-left">
            <h2 className="font-sans text-[28px] sm:text-[40px] font-[600] leading-[1.15] text-white">Questions</h2>
            <div className="mt-8 border-t border-graphite-900">
              {faqs.map((faq, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={faq.q} className="border-b border-graphite-900">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      aria-expanded={open}
                      aria-controls={`faq-${idx}`}
                      className={`w-full py-4 sm:py-5 flex items-center justify-between gap-3 text-left text-white ${focus}`}
                    >
                      <span className="font-sans text-[17px] sm:text-[21px] font-[500] leading-[1.33]">{faq.q}</span>
                      <ChevronRight
                        aria-hidden="true"
                        className={`size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {open && (
                      <div id={`faq-${idx}`} className="pb-5 text-[15px] sm:text-[16px] leading-[1.6] text-graphite-200 max-w-[62ch]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
