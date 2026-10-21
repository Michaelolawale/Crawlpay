'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  FileText,
  Cpu,
  Activity,
  HelpCircle,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { AuditHomeTab } from '@/components/tabs/AuditHomeTab';
import { ReportsTab } from '@/components/tabs/ReportsTab';
import { ForAgentsTab } from '@/components/tabs/ForAgentsTab';
import { ActivityTab } from '@/components/tabs/ActivityTab';
import { AboutTab } from '@/components/tabs/AboutTab';
import { FullAuditReport } from '@/types/audit';
import { CONFIG } from '@/config';

type MainTab = 'audit' | 'reports' | 'agents' | 'activity' | 'about';

interface NavItem {
  id: MainTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'audit', label: 'Audit', icon: Search },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'agents', label: 'For Agents', icon: Cpu, badge: 'x402' },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'about', label: 'About', icon: HelpCircle },
];

function AuditWorkspaceContent() {
  const searchParams = useSearchParams();
  const initialTarget = searchParams.get('target') || '';
  const initialTabParam = searchParams.get('tab') as MainTab | null;

  const [activeTab, setActiveTab] = useState<MainTab>(
    initialTabParam && NAV_ITEMS.some((n) => n.id === initialTabParam) ? initialTabParam : 'audit'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recheckUrl, setRecheckUrl] = useState(initialTarget);

  useEffect(() => {
    if (initialTarget) {
      setRecheckUrl(initialTarget);
    }
  }, [initialTarget]);

  const handleRecheck = (url: string, _mode: 'quick' | 'full') => {
    setRecheckUrl(url);
    setActiveTab('audit');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewSavedReport = (_report: FullAuditReport) => {
    setActiveTab('audit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-border bg-card/60 p-4 lg:flex sticky top-0 h-screen">
        <div>
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 px-2 py-3 transition-opacity hover:opacity-90">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <CrawlLogo className="size-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-base font-bold tracking-tight">
                crawl<span className="text-primary">pay</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">celo_757c2ac3b70c</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                        isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-primary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Agent Specs */}
        <div className="rounded-xl border border-border bg-background/80 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Network</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Celo Mainnet
            </span>
          </div>

          <div className="text-[10px] text-muted-foreground font-mono truncate">
            Agent: {CONFIG.AGENT_WALLET_ADDRESS.slice(0, 6)}...{CONFIG.AGENT_WALLET_ADDRESS.slice(-4)}
          </div>

          <p className="text-[10px] text-muted-foreground border-t border-border/60 pt-2 leading-relaxed">
            No accounts · No logins. Settled via HTTP 402 micro-rails.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CrawlLogo className="size-3.5" />
            </span>
            <span className="font-display text-sm font-bold tracking-tight">
              crawl<span className="text-primary">pay</span>
            </span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-border bg-card p-4 lg:hidden space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-primary">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {activeTab === 'audit' && (
            <AuditHomeTab
              initialTarget={recheckUrl}
              onAuditCompleted={() => {
                // Handled in AuditHomeTab
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              onRecheck={handleRecheck}
              onViewReport={handleViewSavedReport}
            />
          )}

          {activeTab === 'agents' && <ForAgentsTab />}

          {activeTab === 'activity' && <ActivityTab />}

          {activeTab === 'about' && <AboutTab />}
        </main>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-xs text-muted-foreground">
          Loading CrawlPay workspace...
        </div>
      }
    >
      <AuditWorkspaceContent />
    </Suspense>
  );
}