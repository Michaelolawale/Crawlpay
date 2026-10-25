'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  ListOrdered,
  Sliders,
  ShieldBan,
  FlaskConical,
  Lock,
  LogOut,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { href: '/admin/payments', label: 'Payments', shortLabel: 'Payments', icon: CreditCard },
  { href: '/admin/jobs', label: 'Jobs', shortLabel: 'Jobs', icon: ListOrdered },
  { href: '/admin/config', label: 'Config', shortLabel: 'Config', icon: Sliders },
  { href: '/admin/abuse', label: 'Abuse & Blocklist', shortLabel: 'Abuse', icon: ShieldBan },
  { href: '/admin/sandbox', label: 'Sandbox (Testing)', shortLabel: 'Sandbox', icon: FlaskConical },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const authed =
      typeof window !== 'undefined'
        ? localStorage.getItem('crawlpay_admin_auth') || sessionStorage.getItem('crawlpay_admin_auth')
        : null;

    if (authed) {
      fetch('/api/admin/auth', {
        headers: { Authorization: `Bearer ${authed}` },
      })
        .then((res) => {
          if (res.ok) {
            setIsAuthenticated(true);
            localStorage.setItem('crawlpay_admin_auth', authed);
            sessionStorage.setItem('crawlpay_admin_auth', authed);
          } else {
            localStorage.removeItem('crawlpay_admin_auth');
            sessionStorage.removeItem('crawlpay_admin_auth');
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          localStorage.removeItem('crawlpay_admin_auth');
          sessionStorage.removeItem('crawlpay_admin_auth');
          setIsAuthenticated(false);
        });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passphrase.trim();
    if (!clean) {
      setAuthError('Please enter the operator passphrase.');
      return;
    }

    setLoggingIn(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: clean }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const token = data.token || clean;
        localStorage.setItem('crawlpay_admin_auth', token);
        sessionStorage.setItem('crawlpay_admin_auth', token);
        setIsAuthenticated(true);
        setPassphrase('');
      } else {
        setAuthError(data.error || 'Invalid credentials. Access denied.');
      }
    } catch {
      setAuthError('Authentication service unreachable. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crawlpay_admin_auth');
    sessionStorage.removeItem('crawlpay_admin_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafb] dark:bg-[#0c0d10] p-4 text-ink dark:text-white transition-colors">
        <div className="relative w-full max-w-md rounded-[24px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-[10px] bg-ink dark:bg-white text-white dark:text-ink shadow-sm">
                <CrawlLogo className="size-5" />
              </span>
              <div>
                <h1 className="font-display text-lg font-bold text-ink dark:text-white">Admin Console</h1>
                <p className="text-xs text-graphite-800 dark:text-graphite-400">Restricted to authorized operators</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-800 dark:text-graphite-300 mb-1.5">
                Operator Passphrase
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter operator key..."
                  autoComplete="current-password"
                  required
                  disabled={loggingIn}
                  className="w-full rounded-[32px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#20212b] px-4 py-2.5 text-xs text-ink dark:text-white placeholder:text-graphite-800/50 dark:placeholder:text-graphite-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink font-mono disabled:opacity-50"
                />
              </div>
              {authError && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{authError}</p>}
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full inline-flex h-[44px] items-center justify-center gap-2 rounded-[48px] bg-ink dark:bg-white px-4 text-xs font-bold text-white dark:text-ink hover:opacity-90 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="size-3.5" />
              <span>{loggingIn ? 'Authenticating...' : 'Unlock Admin Console'}</span>
            </button>
          </form>

          <div className="border-t border-graphite-100 dark:border-graphite-800 pt-4 text-center">
            <Link href="/" className="text-xs text-graphite-800 dark:text-graphite-400 hover:text-ink dark:hover:text-white">
              ← Return to CrawlPay Public Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafb] dark:bg-[#0c0d10] text-ink dark:text-white transition-colors">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-40 border-b border-graphite-100 dark:border-graphite-800 bg-white/95 dark:bg-[#121317]/95 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <span className="flex size-8 items-center justify-center rounded-[10px] bg-ink dark:bg-white text-white dark:text-ink shadow-sm">
                <CrawlLogo className="size-4" />
              </span>
              <span className="font-display text-base font-bold tracking-tight text-ink dark:text-white">
                CrawlPay
              </span>
            </Link>
            <span className="rounded-full bg-violet/10 border border-violet/20 px-2 py-0.5 text-[10px] font-bold text-violet uppercase">
              Admin
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#1a1b22] p-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-[48px] px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                      : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-white dark:hover:bg-[#252631]'
                  }`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="inline xl:hidden">{item.shortLabel || item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/app/audit"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white"
            >
              <span>App</span>
              <ExternalLink className="size-3" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-3.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 transition-colors shadow-sm cursor-pointer"
            >
              <LogOut className="size-3" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto no-scrollbar border-t border-graphite-100 dark:border-graphite-800 px-3 py-2 gap-1.5 bg-[#f4f4f6] dark:bg-[#16171d] flex-nowrap">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-[48px] px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                    : 'text-graphite-800 dark:text-graphite-300 hover:bg-graphite-200/50 dark:hover:bg-[#22232c]'
                }`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{item.shortLabel || item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Admin Page */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {children}
      </main>
    </div>
  );
}
