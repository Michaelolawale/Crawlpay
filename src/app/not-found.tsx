import Link from 'next/link';
import { CrawlLogo } from '@/components/CrawlLogo';
import { SiteHeader, focusRing } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0e12] text-ink dark:text-white font-system selection:bg-lavender-tint selection:text-ink transition-colors flex flex-col justify-between">
      <SiteHeader />

      <main className="max-w-[720px] mx-auto px-4 py-16 sm:py-24 text-center flex flex-col items-center justify-center flex-1">
        <span className="flex size-14 items-center justify-center rounded-[16px] bg-graphite-100 dark:bg-graphite-800 text-ink dark:text-white shadow-sm mb-6">
          <CrawlLogo className="size-8" />
        </span>
        <span className="rounded-full bg-violet/10 dark:bg-violet/20 text-violet text-[12px] font-mono font-medium px-3 py-1 mb-4">
          404 Error
        </span>
        <h1 className="font-sans text-[28px] sm:text-[36px] font-bold text-ink dark:text-white tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-[15px] sm:text-[16px] text-graphite-700 dark:text-graphite-300 max-w-[480px]">
          The page or audit report you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-5 py-2.5 text-[14px] font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors shadow-xs ${focusRing}`}
          >
            <ArrowLeft className="size-4" />
            <span>Back to home</span>
          </Link>
          <Link
            href="/app/audit"
            className={`inline-flex items-center gap-2 rounded-[48px] bg-ink dark:bg-white px-5 py-2.5 text-[14px] font-semibold text-white dark:text-ink hover:opacity-90 transition-opacity shadow-xs ${focusRing}`}
          >
            <Search className="size-4" />
            <span>Run a free audit</span>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}


