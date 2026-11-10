'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CardCarouselProps {
  label: React.ReactNode;
  children: React.ReactNode;
  cardClass?: string;
  className?: string;
  action?: React.ReactNode;
  ariaLabel?: string;
}

export function CardCarousel({
  label,
  children,
  cardClass = 'w-[85%] sm:w-[340px]',
  className = '',
  action,
  ariaLabel,
}: CardCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Compute scroll boundary state
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // 4px threshold for subpixel / rounding tolerance
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollState();

    el.addEventListener('scroll', updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    const mutationObserver = new MutationObserver(() => {
      updateScrollState();
    });
    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollState]);

  // Scroll by ~80% of visible container width
  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const delta = el.clientWidth * 0.8 * (direction === 'left' ? -1 : 1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Keyboard navigation: Left/Right arrows scroll
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scroll('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scroll('right');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header row: label on left, prev/next arrows on right (sm and up) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {typeof label === 'string' ? (
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white truncate">
              {label}
            </h3>
          ) : (
            label
          )}
          {action}
        </div>

        {/* Prev / Next buttons: hidden on mobile (<sm), visible on sm and up, hidden on print */}
        <div
          className="hidden sm:flex items-center gap-1.5 no-print shrink-0"
          aria-label="Carousel pagination"
        >
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`p-1.5 rounded-lg border border-graphite-200 dark:border-graphite-700/80 bg-white dark:bg-[#1a1b22] text-graphite-700 dark:text-graphite-300 transition-all ${
              canScrollLeft
                ? 'hover:bg-graphite-100 dark:hover:bg-graphite-800 cursor-pointer shadow-xs active:scale-95'
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`p-1.5 rounded-lg border border-graphite-200 dark:border-graphite-700/80 bg-white dark:bg-[#1a1b22] text-graphite-700 dark:text-graphite-300 transition-all ${
              canScrollRight
                ? 'hover:bg-graphite-100 dark:hover:bg-graphite-800 cursor-pointer shadow-xs active:scale-95'
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Carousel container with edge fade gradients */}
      <div className="relative">
        {/* Left edge fade gradient: appears only when more content exists in that direction */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-white dark:from-[#16171d] to-transparent z-10 transition-opacity duration-200 no-print ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Right edge fade gradient: appears only when more content exists in that direction */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-white dark:from-[#16171d] to-transparent z-10 transition-opacity duration-200 no-print ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Scrollable track: snap-x snap-mandatory, scroll-smooth, hidden scrollbar, focusable with ring */}
        <div
          ref={containerRef}
          tabIndex={0}
          role="region"
          aria-label={ariaLabel || (typeof label === 'string' ? label : 'Card Carousel')}
          onKeyDown={handleKeyDown}
          className="flex items-stretch gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-1 px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 rounded-xl print:flex-wrap print:overflow-visible"
        >
          {React.Children.map(children, (child, idx) => {
            if (!child) return null;
            return (
              <div
                key={idx}
                className={`snap-start shrink-0 flex flex-col ${cardClass} print:w-full print:mb-3`}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CardCarousel;

