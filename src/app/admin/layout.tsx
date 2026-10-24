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

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/jobs', label: 'Jobs', icon: ListOrdered },
  { href: '/admin/config', label: 'Config', icon: Sliders },
  { href: '/admin/abuse', label: 'Abuse & Blocklist', icon: ShieldBan },
  { href: '/admin/sandbox', label: 'Sandbox (Testing)', icon: FlaskConical },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const authed = sessionStorage.getItem('crawlpay_admin_auth');
    if (authed) {
      fetch('/api/admin/auth', {
        headers: { Authorization: `Bearer ${authed}` },
      })
        .then((res) => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem('crawlpay_admin_auth');
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
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
        sessionStorage.setItem('crawlpay_admin_auth', data.token || clean);
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
    sessionStorage.removeItem('crawlpay_admin_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground selection:bg-primary/20">
        <div className="pointer-events-none fixed inset-0 dot-grid opacity-20" aria-hidden="true" />
        <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CrawlLogo className="size-5" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold">Admin Console</h1>
              <p className="text-xs text-muted-foreground">Restricted to authorized operators</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
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
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono disabled:opacity-50"
                />
              </div>
              {authError && <p className="mt-1.5 text-xs text-destructive">{authError}</p>}
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              <KeyRound className="size-3.5" />
              <span>{loggingIn ? 'Authenticating...' : 'Unlock Admin Console'}</span>
            </button>
          </form>

          <div className="border-t border-border pt-4 text-center">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Return to Crawlpay Public Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-20" aria-hidden="true" />

      {/* Admin Top Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <CrawlLogo className="size-4" />
              </span>
              <span className="font-display text-base font-bold tracking-tight">
                crawl<span className="text-primary">pay</span>
              </span>
            </Link>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
              Admin
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl border border-border bg-card/60 p-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/app/audit"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <span>App</span>
              <ExternalLink className="size-3" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-3" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto no-scrollbar border-t border-border px-3 py-2 gap-1 bg-card/40">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs ${
                  isActive ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                <Icon className="size-3" />
                <span>{item.label}</span>
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
