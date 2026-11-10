'use client';

import React, { useState, useEffect, useMemo } from 'react';

export interface SiteLogoProps {
  domain: string;
  candidates?: string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg' | number;
}

export function SiteLogo({
  domain,
  candidates = [],
  className = '',
  size = 'md',
}: SiteLogoProps) {
  // Extract clean domain for query, alt text, and fallback
  const cleanDomain = domain
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .split('?')[0] || 'domain.com';

  const firstLetter = cleanDomain.charAt(0).toUpperCase() || 'W';

  // Construct source list: candidates best-first, then Google Favicons service
  const sources = useMemo(() => {
    const list = Array.isArray(candidates) ? [...candidates.filter(Boolean)] : [];
    const googleFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=128`;
    if (!list.includes(googleFavicon)) {
      list.push(googleFavicon);
    }
    return list;
  }, [candidates, cleanDomain]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Reset indices whenever domain or candidates change
  useEffect(() => {
    setCurrentIndex(0);
    setIsLoading(true);
  }, [cleanDomain, candidates]);

  const hasMoreSources = currentIndex < sources.length;
  const currentSrc = hasMoreSources ? sources[currentIndex] : null;

  const handleImageError = () => {
    setCurrentIndex((prev) => prev + 1);
    setIsLoading(true);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const isCustomNumeric = typeof size === 'number';
  const sizeClasses = !isCustomNumeric
    ? {
        sm: 'size-10 min-w-10 rounded-xl p-1.5 text-base',
        md: 'size-14 min-w-14 sm:size-16 sm:min-w-16 rounded-xl p-2 text-xl sm:text-2xl',
        lg: 'size-20 min-w-20 rounded-xl p-2.5 text-3xl',
      }[size] || 'size-14 min-w-14 sm:size-16 sm:min-w-16 rounded-xl p-2 text-xl sm:text-2xl'
    : 'rounded-xl p-2 text-xl';

  return (
    <div
      style={isCustomNumeric ? { width: `${size}px`, height: `${size}px`, minWidth: `${size}px` } : undefined}
      className={`relative flex items-center justify-center shrink-0 rounded-xl border border-graphite-200 dark:border-graphite-700/80 bg-white dark:bg-[#1a1b22] shadow-xs overflow-hidden select-none ${sizeClasses} ${className}`}
      title={`${cleanDomain} logo`}
    >
      {/* Subtle pulse skeleton while loading an image candidate */}
      {isLoading && hasMoreSources && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-graphite-100 dark:bg-graphite-800 animate-pulse rounded-xl z-0"
        />
      )}

      {hasMoreSources && currentSrc ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={`${cleanDomain} logo`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={`size-full object-contain relative z-10 transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        /* Fallback: Letter avatar (first letter of domain, violet, uppercase) */
        <span
          className="font-display font-extrabold text-violet uppercase tracking-tight relative z-10"
          aria-label={`${cleanDomain} logo letter`}
        >
          {firstLetter}
        </span>
      )}
    </div>
  );
}

export default SiteLogo;

