'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet';

export const NAV_LINKS = [
  { href: '/example', label: 'Sample report' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href.startsWith('/#')) return false;
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 h-[64px] bg-white dark:bg-[#121317] border-b border-graphite-100 dark:border-graphite-800 transition-colors">
      <div className="max-w-[1176px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Link */}
        <Link href="/" className={`flex items-center gap-2.5 shrink-0 ${focusRing}`}>
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-ink dark:bg-white text-white dark:text-ink shadow-sm">
            <CrawlLogo className="size-5" />
          </span>
          <span className="font-sans font-[600] text-[20px] text-ink dark:text-white tracking-tight">
            CrawlPay
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main" className="hidden lg:flex items-center gap-8 text-[16px]">
          {NAV_LINKS.map((n) => {
            const active = isLinkActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`${
                  active
                    ? 'text-violet font-semibold'
                    : 'text-ink dark:text-graphite-200 hover:opacity-70'
                } transition-opacity whitespace-nowrap ${focusRing}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/app/audit"
            className={`hidden sm:inline-flex bg-ink dark:bg-white text-white dark:text-ink rounded-[48px] px-6 py-[7px] text-[14px] hover:opacity-90 transition-opacity ${focusRing}`}
          >
            Run free audit
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
            className={`lg:hidden p-1.5 text-ink dark:text-white hover:opacity-70 ${focusRing}`}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#121317] border-b border-graphite-100 dark:border-graphite-800 px-4 py-4 space-y-1 shadow-lg">
          {NAV_LINKS.map((n) => {
            const active = isLinkActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-2 text-[16px] ${
                  active
                    ? 'text-violet font-semibold'
                    : 'text-ink dark:text-white'
                } ${focusRing}`}
              >
                {n.label}
              </Link>
            );
          })}
          <Link
            href="/app/audit"
            onClick={() => setMenuOpen(false)}
            className={`mt-2 flex justify-center bg-ink dark:bg-white text-white dark:text-ink rounded-[48px] px-6 py-2.5 text-[14px] ${focusRing}`}
          >
            Run free audit
          </Link>
        </div>
      )}
    </header>
  );
}

