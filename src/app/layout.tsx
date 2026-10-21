import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CrawlPay — On-demand site audits',
  description: 'On-demand, granular site audits—settled only when the agent crawls, not on a monthly subscription.',
  keywords: ['celo', 'x402', 'seo', 'agent', 'micropayments', 'crawler', 'audit'],
  openGraph: {
    title: 'CrawlPay — On-demand site audits',
    description: 'On-demand, granular site audits—settled only when the agent crawls, not on a monthly subscription.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
