import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://crawlpay.vercel.app'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'CrawlPay — Autonomous Site Audits (SEO, AEO & GEO)',
    template: '%s | CrawlPay (SEO, AEO & GEO)',
  },
  description: 'On-demand technical SEO, AEO query mapping, and GEO generative citability audits—settled per crawl via x402 on Celo.',
  authors: [{ name: 'CrawlPay Protocol', url: 'https://crawlpay.vercel.app' }],
  creator: 'CrawlPay Protocol',
  publisher: 'CrawlPay',
  keywords: ['celo', 'x402', 'seo', 'aeo', 'geo', 'ai search', 'agent', 'micropayments', 'crawler', 'audit'],
  openGraph: {
    title: 'CrawlPay — Autonomous Site Audits (SEO, AEO & GEO)',
    description: 'On-demand technical SEO, AEO query mapping, and GEO generative citability audits—settled per crawl via x402 on Celo.',
    url: 'https://crawlpay.vercel.app',
    siteName: 'CrawlPay',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'CrawlPay — Autonomous Technical SEO, AEO & GEO Audits on Celo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrawlPay — Autonomous Site Audits (SEO, AEO & GEO)',
    description: 'On-demand technical SEO, AEO query mapping, and GEO generative citability audits—settled per crawl via x402 on Celo.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.svg',
    apple: '/logo-dark.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,500;1,9..40,600;1,9..40,700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('crawlpay_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-ink antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
