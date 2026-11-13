'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, Lock, CheckCircle2, Send, MessageCircle } from 'lucide-react';
import { SiteHeader, focusRing } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { useConfig } from '@/context/ConfigContext';

const SUPPORT_TELEGRAM = 'https://t.me/Noble249';

export default function TermsPage() {
  const { fullPriceFormatted } = useConfig();
  useEffect(() => {
    document.title = 'Terms of service and refund policy | CrawlPay';
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0e12] text-ink dark:text-white font-system selection:bg-lavender-tint selection:text-ink overflow-x-hidden transition-colors">
      {/* 1. SHARED HEADER */}
      <SiteHeader />

      {/* 2. HERO / BANNER */}
      <section className="bg-[#f4f4f6] dark:bg-[#121317] border-b border-graphite-100 dark:border-graphite-800 py-[48px] sm:py-[64px]">
        <div className="max-w-[1020px] mx-auto px-4 sm:px-6">
          <h1 className="font-sans text-[32px] sm:text-[44px] font-[600] leading-[1.15] text-ink dark:text-white tracking-tight">
            Terms of service and refund policy
          </h1>
          <p className="text-[15px] sm:text-[17px] leading-[1.6] text-graphite-800 dark:text-graphite-200 font-normal max-w-[720px] mt-3">
            How audits work, how payments and refunds are handled, and how your reports are kept private.
          </p>
        </div>
      </section>

      {/* 3. MAIN TERMS CONTENT */}
      <main className="max-w-[1020px] mx-auto px-4 sm:px-6 py-[48px] sm:py-[64px] space-y-12">
        {/* About CrawlPay */}
        <section id="about" className="space-y-4 scroll-mt-24">
          <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink dark:text-white pb-2 border-b border-graphite-100 dark:border-graphite-800">
            About CrawlPay
          </h2>
          <div className="rounded-[20px] bg-[#f4f4f6] dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-800 p-6 sm:p-7 text-[15px] leading-[1.6] text-graphite-800 dark:text-graphite-200">
            <p suppressHydrationWarning>
              CrawlPay checks websites to see how search engines and AI assistants read your pages. Free quick audits check any single page without an account or signup. Deep crawls audit up to 50 pages for {fullPriceFormatted}, paid with USDT on Celo. There are no monthly subscriptions, lock-ins, or hidden charges.
            </p>
          </div>
        </section>

        {/* Refund Policy */}
        <section id="refund" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2.5 pb-2 border-b border-graphite-100 dark:border-graphite-800">
            <RefreshCw className="size-5 text-violet shrink-0" aria-hidden="true" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink dark:text-white">
              Refund policy
            </h2>
          </div>

          <div className="rounded-[20px] bg-[#f4f4f6] dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-800 p-6 sm:p-7 space-y-5 text-[15px] leading-[1.6] text-graphite-800 dark:text-graphite-200">
            <p suppressHydrationWarning>
              When you start a deep crawl, your {fullPriceFormatted} payment in USDT is confirmed on the Celo blockchain. If CrawlPay cannot deliver your completed audit, you are entitled to a full refund.
            </p>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-ink dark:text-white font-semibold">Automatic retry:</strong> If a crawl is interrupted by a temporary network drop or slow website response, CrawlPay automatically tries again before stopping.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-ink dark:text-white font-semibold">Failed audits:</strong> If a website is offline, actively blocks crawlers, or the system cannot finish generating your audit after payment, you receive a full refund.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-ink dark:text-white font-semibold">How to request a refund:</strong> Message our support operator on Telegram at{' '}
                  <a
                    href={SUPPORT_TELEGRAM}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-semibold text-violet underline hover:opacity-80 ${focusRing}`}
                  >
                    @Noble249
                  </a>{' '}
                  with your transaction ID, website address, and wallet address. Refunds are confirmed and sent back to your wallet within 24 hours.
                </div>
              </li>
            </ul>

            {/* Telegram Support Panel */}
            <div className="mt-5 rounded-[16px] border border-violet/30 bg-white dark:bg-[#121317] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-violet text-white shrink-0">
                  <Send className="size-5" />
                </span>
                <div>
                  <div className="font-sans font-semibold text-ink dark:text-white text-[15px]">Official support operator</div>
                  <div className="text-[13px] text-graphite-700 dark:text-graphite-300">Telegram @Noble249 for refund requests and audit assistance</div>
                </div>
              </div>
              <a
                href={SUPPORT_TELEGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-[48px] bg-violet hover:bg-violet/90 text-white px-5 py-2.5 text-[14px] font-medium transition-all shrink-0 ${focusRing}`}
              >
                <MessageCircle className="size-4" />
                <span>Message @Noble249</span>
              </a>
            </div>
          </div>
        </section>

        {/* Report Access & Privacy Policy */}
        <section id="privacy" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2.5 pb-2 border-b border-graphite-100 dark:border-graphite-800">
            <ShieldCheck className="size-5 text-violet shrink-0" aria-hidden="true" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink dark:text-white">
              Report access and privacy
            </h2>
          </div>
          <div className="rounded-[20px] bg-[#f4f4f6] dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-800 p-6 sm:p-7 space-y-3 text-[15px] leading-[1.6] text-graphite-800 dark:text-graphite-200">
            <p>
              <strong className="text-ink dark:text-white font-semibold">Private report links:</strong> Every audit gets its own unique, private link. Anyone with the direct link can view the findings, making it easy to share results with clients and colleagues without creating accounts.
            </p>
            <p>
              Search privacy: Your reports are private and will not appear in search engine listings or public directories unless you share them.
            </p>
          </div>
        </section>

        {/* Acceptable Use & Crawler Safety */}
        <section id="security" className="space-y-4 pb-8 scroll-mt-24">
          <div className="flex items-center gap-2.5 pb-2 border-b border-graphite-100 dark:border-graphite-800">
            <Lock className="size-5 text-violet shrink-0" aria-hidden="true" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink dark:text-white">
              Acceptable use and crawler safety
            </h2>
          </div>
          <div className="rounded-[20px] bg-[#f4f4f6] dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-800 p-6 sm:p-7 space-y-3 text-[15px] leading-[1.6] text-graphite-800 dark:text-graphite-200">
            <p>
              Public websites only: CrawlPay audits publicly accessible web pages. It cannot be used to access password-protected pages or private internal networks.
            </p>
            <p>
              Network safety: CrawlPay only scans public domain addresses. Requests targeting private internal servers, local network addresses, or internal cloud services are automatically rejected.
            </p>
          </div>
        </section>
      </main>

      {/* 4. SHARED SITE FOOTER */}
      <SiteFooter />
    </div>
  );
}
