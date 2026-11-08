import React from 'react';

const MASK_STYLE = {
  maskImage: 'radial-gradient(ellipse 95% 85% at 50% 50%, black 50%, transparent 100%)',
  WebkitMaskImage: 'radial-gradient(ellipse 95% 85% at 50% 50%, black 50%, transparent 100%)',
};

export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={MASK_STYLE}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          {/* Subtle dot matrix grid */}
          <pattern id="hero-dot-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle
              cx="2"
              cy="2"
              r="1"
              className="fill-graphite-400/40 dark:fill-graphite-600/50"
            />
          </pattern>
        </defs>

        {/* Ambient background dot grid */}
        <rect width="100%" height="100%" fill="url(#hero-dot-grid)" />
      </svg>
    </div>
  );
}
