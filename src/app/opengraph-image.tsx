import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CrawlPay — Autonomous Technical SEO, AEO & GEO Audits on Celo';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0c0d10',
          padding: '64px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Subtle background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            right: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(108, 94, 220, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Top Header: Brand + Tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#6c5edc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <rect x="7" y="6" width="10" height="12" rx="4" fill="#ffffff" />
                <path d="M4 6l3 3M4 12h3M4 18l3-3M20 6l-3 3M20 12h-3M20 18l-3-3" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>
            <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}>CrawlPay</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '999px',
              backgroundColor: '#1b1c24',
              border: '1px solid #2d2e3d',
              fontSize: '15px',
              color: '#a1a1aa',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Celo Mainnet &bull; Chain 42220</span>
          </div>
        </div>

        {/* Center: Main Headline & Pitch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '960px' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#a78bfa',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Technical SEO &bull; AEO &bull; GEO Platform
          </div>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            Autonomous Site Audits.
            <br />
            Pay per crawl, not per month.
          </div>
          <div style={{ fontSize: '22px', color: '#a1a1aa', lineHeight: 1.5, marginTop: '8px' }}>
            Instant search engine, answer engine, and AI citability audits with ready-to-deploy code fixes for Next.js, WordPress &amp; Shopify.
          </div>
        </div>

        {/* Bottom Bar: Key Feature Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: '#171821',
              border: '1px solid #282937',
              fontSize: '16px',
              fontWeight: 600,
              color: '#e4e4e7',
            }}
          >
            Traditional SEO
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: '#171821',
              border: '1px solid #282937',
              fontSize: '16px',
              fontWeight: 600,
              color: '#e4e4e7',
            }}
          >
            AEO Direct Answers
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: '#171821',
              border: '1px solid #282937',
              fontSize: '16px',
              fontWeight: 600,
              color: '#e4e4e7',
            }}
          >
            GEO Generative Citations
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: '#231d3d',
              border: '1px solid #4c3e8a',
              fontSize: '16px',
              fontWeight: 600,
              color: '#c4b5fd',
            }}
          >
            x402 Micropayments
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

