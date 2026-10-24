import React from 'react';

interface CrawlLogoProps {
  className?: string;
  size?: number;
}

export function CrawlLogo({ className = 'size-5', size }: CrawlLogoProps) {
  return (
    <span
      className={`inline-flex items-center justify-center select-none leading-none ${className}`}
      style={size ? { fontSize: size * 0.8 } : undefined}
      role="img"
      aria-label="Crawlpay Spider Logo"
    >
      🕷
    </span>
  );
}
