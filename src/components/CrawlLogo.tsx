import React from 'react';

interface CrawlLogoProps {
  className?: string;
  size?: number;
  variant?: 'icon' | 'badge-dark' | 'badge-light';
}

export function CrawlLogo({ className = 'size-5', size, variant = 'icon' }: CrawlLogoProps) {
  const iconSvg = (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={variant === 'icon' ? className : 'size-[72%]'}
      style={size && variant === 'icon' ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Head */}
      <circle cx="50" cy="35" r="5.5" />
      {/* Thorax */}
      <circle cx="50" cy="46" r="7" />
      {/* Abdomen */}
      <ellipse cx="50" cy="62" rx="10.5" ry="13.5" />
      
      {/* 8 Symmetrical Legs in Exact 4-Up, 4-Down Arches */}
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {/* Top Left Legs */}
        <path d="M 45 42 C 37 34, 37 21, 44 14" />
        <path d="M 43 45 C 31 36, 27 25, 31 18" />
        {/* Bottom Left Legs */}
        <path d="M 43 49 C 29 55, 27 69, 31 80" />
        <path d="M 45 54 C 36 63, 36 76, 44 86" />

        {/* Top Right Legs */}
        <path d="M 55 42 C 63 34, 63 21, 56 14" />
        <path d="M 57 45 C 69 36, 73 25, 69 18" />
        {/* Bottom Right Legs */}
        <path d="M 57 49 C 71 55, 73 69, 69 80" />
        <path d="M 55 54 C 64 63, 64 76, 56 86" />
      </g>
    </svg>
  );

  if (variant === 'badge-dark') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-[10px] bg-[#0d0e12] text-white shadow-sm shrink-0 border border-white/10 ${className}`}
        style={size ? { width: size, height: size } : undefined}
        role="img"
        aria-label="CrawlPay Spider Logo"
      >
        {iconSvg}
      </span>
    );
  }

  if (variant === 'badge-light') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-[10px] bg-white text-ink shadow-sm shrink-0 border border-graphite-200 ${className}`}
        style={size ? { width: size, height: size } : undefined}
        role="img"
        aria-label="CrawlPay Spider Logo"
      >
        {iconSvg}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center select-none leading-none shrink-0 ${className}`}
      role="img"
      aria-label="CrawlPay Spider Logo"
    >
      {iconSvg}
    </span>
  );
}
