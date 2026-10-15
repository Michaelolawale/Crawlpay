import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CrawlPay — Autonomous Technical SEO & Competitor Intelligence on Celo',
  description: 'On-demand technical SEO audits and competitor gap analysis paid micro-cent by micro-cent over HTTP 402 on Celo Mainnet. Built with buy.',
  keywords: ['celo', 'x402', 'seo', 'agent', 'micropayments', 'crawler', 'audit'],
  openGraph: {
    title: 'CrawlPay — Autonomous Technical SEO on Celo',
    description: 'On-demand technical SEO audits paid per call over HTTP 402 on Celo Mainnet.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="glow-orb orb-3" />
        {children}
      </body>
    </html>
  );
}
