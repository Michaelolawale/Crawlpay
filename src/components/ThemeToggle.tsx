'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`size-9 rounded-[48px] border border-graphite-100 bg-white/50 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative inline-flex items-center justify-center gap-1.5 rounded-[48px] border border-graphite-100 bg-white px-2.5 py-1.5 text-xs font-medium text-ink shadow-sm transition-all hover:bg-graphite-100/50 hover:shadow cursor-pointer ${
        isDark ? 'dark:border-graphite-800 dark:bg-[#1f2025] dark:text-white dark:hover:bg-[#282a31]' : ''
      } ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative size-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="size-4 text-amber-400 transition-transform duration-300 rotate-0 group-hover:rotate-45" />
        ) : (
          <Moon className="size-4 text-violet transition-transform duration-300 -rotate-12 group-hover:rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="font-sans text-[13px] font-normal hidden sm:inline">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
