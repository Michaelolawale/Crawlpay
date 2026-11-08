import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Applebot-Extended', 'Googlebot', 'Bingbot'],
        allow: '/',
      },
    ],
    sitemap: 'https://crawlpay.vercel.app/sitemap.xml',
  };
}

