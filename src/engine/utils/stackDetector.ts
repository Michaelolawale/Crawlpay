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
export function getStackFix(checkId: string, stack: SiteMetadata['detectedStack']): string {
  const { cms, seoPlugin } = stack;

  if (cms === 'WordPress') {
    if (seoPlugin === 'Yoast') {
      return "Edit under the page's Yoast SEO box, or navigate to Yoast > Settings > Search appearance for site-wide template rules.";
    }
    if (seoPlugin === 'RankMath') {
      return "Edit under the Rank Math SEO box on the page editor, or go to Rank Math > Titles & Meta for global template defaults.";
    }
    return "Update in WordPress Admin > Appearance > Customize, or manage site-wide tags via Yoast SEO / Rank Math plugins.";
  }

  if (cms === 'Shopify') {
    if (checkId.startsWith('titles_and_descriptions') || checkId.startsWith('canonical')) {
      return "In Shopify Admin, go to Online Store > Preferences for homepage meta tags, or Online Store > Themes > Actions > Edit code (theme.liquid) for canonical tags.";
    }
    if (checkId.startsWith('images')) {
      return "Update image ALT tags directly in Shopify Admin > Products / Files, and upload modern WebP formats.";
    }
    return "Modify the layout template in Shopify Admin > Online Store > Themes > Edit code (layout/theme.liquid).";
  }

  if (cms === 'Next.js') {
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

  if (cms === 'Wix') {
    return "In Wix Dashboard, go to Marketing & SEO > SEO Tools > URL Redirect Manager / SEO Settings to adjust canonicals and meta configurations.";
  }

  if (cms === 'Squarespace') {
    return "Go to Home > Marketing > SEO in Squarespace to set site-wide meta rules, or open Page Settings > SEO for individual page overrides.";
  }

  // Generic fallback
  return "Add or correct the corresponding HTML tag in your site's server template or HTML <head> section.";
}
