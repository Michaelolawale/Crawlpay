import React from 'react';

interface CrawlLogoProps {
  className?: string;
  size?: number;
}

export function CrawlLogo({ className = 'size-5', size }: CrawlLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Central intelligent crawler core */}
      <circle cx="12" cy="12" r="3.2" fill="currentColor" fillOpacity="0.18" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      
      {/* Symmetrical crawler node legs */}
      <path d="M7 6L4.5 3.5" />
      <path d="M17 6L19.5 3.5" />
      <path d="M5.5 12H2.5" />
      <path d="M21.5 12H18.5" />
      <path d="M7 18L4.5 20.5" />
      <path d="M17 18L19.5 20.5" />

      {/* Hexagonal web contour */}
      <path
        d="M12 4.5L18.5 8.2V15.8L12 19.5L5.5 15.8V8.2L12 4.5Z"
        strokeWidth="1.6"
        strokeDasharray="2 2"
        strokeOpacity="0.75"
      />
    </svg>
  );
}
