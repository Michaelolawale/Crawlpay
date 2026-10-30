import * as cheerio from 'cheerio';
import { SiteMetadata } from '../types';

export function detectStackFromHtml(html: string, $: cheerio.CheerioAPI): SiteMetadata['detectedStack'] {
  let cms: SiteMetadata['detectedStack']['cms'] = 'Unknown';
  let seoPlugin: SiteMetadata['detectedStack']['seoPlugin'] = 'None';
  let framework: string | undefined = undefined;

  const htmlLower = html.toLowerCase();

  // WordPress detection
  const hasWpContent = htmlLower.includes('/wp-content/') || htmlLower.includes('/wp-includes/') || htmlLower.includes('/wp-json/');
  const metaGenerator = $('meta[name="generator"]').attr('content') || '';
  const isWordPress = hasWpContent || metaGenerator.toLowerCase().includes('wordpress');

  if (isWordPress) {
    cms = 'WordPress';
    // Yoast check: HTML comment "optimized with the Yoast SEO plugin"
    if (html.includes('optimized with the Yoast SEO plugin') || htmlLower.includes('yoast seo')) {
      seoPlugin = 'Yoast';
    } else if (html.includes('Rank Math SEO') || htmlLower.includes('rank math')) {
      seoPlugin = 'RankMath';
    }
  }

  // Shopify detection
  if (
    htmlLower.includes('cdn.shopify.com') ||
    htmlLower.includes('window.shopify') ||
    htmlLower.includes('shopify.theme') ||
    $('link[href*="cdn.shopify.com"]').length > 0
  ) {
    cms = 'Shopify';
  }

  // Next.js detection
  if (
    html.includes('__NEXT_DATA__') ||
    htmlLower.includes('/_next/static') ||
    $('script#__NEXT_DATA__').length > 0
  ) {
    cms = 'Next.js';
    framework = 'Next.js App/Pages Router';
  }

  // Astro detection
  if (htmlLower.includes('astro') || htmlLower.includes('_astro/') || $('meta[name="generator"][content*="Astro"]').length > 0) {
    cms = 'Astro';
    framework = 'Astro Static/SSR';
  }

  // Wix detection
  if (
    htmlLower.includes('wix.com') ||
    htmlLower.includes('x-wix-renderer-server') ||
    htmlLower.includes('static.wixstatic.com')
  ) {
    cms = 'Wix';
  }

  // Squarespace detection
  if (
    htmlLower.includes('static1.squarespace.com') ||
    htmlLower.includes('squarespace.com') ||
    $('html[data-website-id]').length > 0
  ) {
    cms = 'Squarespace';
  }

  return { cms, seoPlugin, framework };
}

/**
 * Returns a tailored stack fix instruction based on the detected CMS and SEO plugins
 */
export function getStackFix(
  checkId: string,
  stack?: Partial<SiteMetadata['detectedStack']> | { cms?: string; seoPlugin?: string; framework?: string } | null
): string {
  const cms = stack?.cms || 'Unknown';
  const seoPlugin = stack?.seoPlugin || 'None';

  if (cms === 'WordPress') {
    if (checkId.startsWith('links')) {
      return "In the WordPress Block Editor, select the link and add descriptive text, or add aria-label='Description' to icon links in your navigation or templates.";
    }
    if (checkId.startsWith('images')) {
      return "Insert media using WordPress Core Image blocks to automatically include responsive width, height, and srcset attributes to prevent CLS.";
    }
    if (checkId.startsWith('mobile')) {
      return "Ensure your theme header.php includes '<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">' and set explicit width/height on all media in Media Library to prevent mobile CLS.";
    }
    if (checkId.startsWith('titles') || checkId.startsWith('descriptions')) {
      if (seoPlugin === 'Yoast') {
        return "Edit under the page's Yoast SEO box, or navigate to Yoast > Settings > Search appearance for site-wide template rules.";
      }
      if (seoPlugin === 'RankMath') {
        return "Edit under the Rank Math SEO box on the page editor, or go to Rank Math > Titles & Meta for global template defaults.";
      }
      return "Configure page titles in the WordPress page editor or install Yoast SEO / Rank Math to customize title tags and meta descriptions.";
    }
    if (checkId.startsWith('headings')) {
      return "In the WordPress Block Editor, ensure there is exactly one H1 heading at the top of the post/page, and organize sub-sections with H2 and H3 blocks.";
    }
    if (checkId.startsWith('canonical')) {
      return "Verify your theme header.php calls wp_head() and check Settings > General to confirm your preferred canonical HTTPS address.";
    }
    if (checkId.startsWith('sitemap')) {
      return "WordPress 5.5+ includes core XML sitemaps at /wp-sitemap.xml. Ensure it is accessible and declared in your robots.txt.";
    }
    return "Update in WordPress Admin under the page editor, or manage global settings via your active SEO plugin.";
  }

  if (cms === 'Shopify') {
    if (checkId.startsWith('mobile')) {
      return "In Shopify Admin, go to Online Store > Themes > Edit code (layout/theme.liquid) and verify `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">` is present without zoom restrictions.";
    }
    if (checkId.startsWith('titles_and_descriptions') || checkId.startsWith('canonical')) {
      return "In Shopify Admin, go to Online Store > Preferences for homepage meta tags, or Online Store > Themes > Actions > Edit code (theme.liquid) for canonical tags.";
    }
    if (checkId.startsWith('images')) {
      return "Update image ALT tags directly in Shopify Admin > Products / Files, and upload modern WebP formats.";
    }
    return "Modify the layout template in Shopify Admin > Online Store > Themes > Edit code (layout/theme.liquid).";
  }

  if (cms === 'Next.js') {
    if (checkId.startsWith('mobile')) {
      return "In Next.js 14/15 App Router `layout.tsx`, export a `viewport: Viewport = { width: 'device-width', initialScale: 1 }` object and use `next/image` with responsive `sizes` to resolve mobile CLS.";
    }
    if (checkId.startsWith('titles_and_descriptions') || checkId.startsWith('canonical')) {
      return "Export a dynamic or static `metadata` object in your App Router `page.tsx` / `layout.tsx` (e.g. `export const metadata: Metadata = { title, description, alternates: { canonical } }`).";
    }
    if (checkId.startsWith('structured_data')) {
      return "Render a `<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />` inside your App Router `layout.tsx` or `page.tsx`.";
    }
    if (checkId.startsWith('images')) {
      return "Use the `next/image` component with explicit `width`, `height`, and `alt` properties to prevent CLS and auto-serve AVIF/WebP.";
    }
    return "Configure in your Next.js App Router `layout.tsx` or `next.config.js`.";
  }

  if (cms === 'Astro') {
    if (checkId.startsWith('mobile')) {
      return "In your `src/layouts/Layout.astro`, ensure `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />` is included in `<head>` and use `<Image>` from `astro:assets`.";
    }
    return "Update the frontmatter metadata and `<head>` tags in `src/layouts/Layout.astro` or your page components.";
  }

  if (cms === 'Wix') {
    return "In Wix Dashboard, go to Marketing & SEO > SEO Tools > URL Redirect Manager / SEO Settings to adjust canonicals and meta configurations.";
  }

  if (cms === 'Squarespace') {
    return "Go to Home > Marketing > SEO in Squarespace to set site-wide meta rules, or open Page Settings > SEO for individual page overrides.";
  }

  // AEO & GEO tailored fixes
  if (checkId.startsWith('aeo.')) {
    if (checkId === 'aeo.question_headings') {
      return "Rephrase section subheadings (H2/H3) as explicit user questions (e.g. 'What is...', 'How does...') to match AI answer engine queries.";
    }
    if (checkId === 'aeo.faq_schema') {
      return "Provide on-page Q&A text backed by clean FAQPage JSON-LD schema for machine and answer engine extraction.";
    }
    if (checkId === 'aeo.structured_answers') {
      return "Format procedural steps with <ol>/<ul> lists and comparative data with <table> tags so answer engines extract structured data.";
    }
  }

  if (checkId.startsWith('geo.')) {
    if (checkId === 'geo.ai_bot_access') {
      return "In robots.txt, ensure User-agent: GPTBot, ClaudeBot, and PerplexityBot are permitted without broad Disallow directives.";
    }
    if (checkId === 'geo.waf_probe') {
      return "Update edge WAF / Cloudflare managed rules to allow legitimate AI crawlers (GPTBot, PerplexityBot) through without 403 blocks.";
    }
    if (checkId === 'geo.client_render_barrier') {
      return "Enable Server-Side Rendering (SSR) or SSG so AI scrapers receive pre-rendered HTML without requiring client-side JS.";
    }
    if (checkId === 'geo.entity_declared') {
      return "Add valid sameAs URIs to schema.org Organization (e.g. Wikidata, Wikipedia, GitHub) to anchor brand identity in LLM knowledge graphs.";
    }
    if (checkId === 'geo.authorship_freshness') {
      return "Include author attribution (<meta name='author'> or Person schema) and ISO-8601 publication timestamps on your content.";
    }
  }

  // Generic fallback
  return "Add or correct the corresponding HTML tag in your site's server template or HTML <head> section.";
}
