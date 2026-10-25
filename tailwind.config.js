/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#18181a',
        'graphite-800': '#454549',
        'graphite-900': '#2f2f31',
        'graphite-100': '#e6e6e8',
        'graphite-200': '#cfcfd1',
        'graphite-300': '#b7b7bb',
        'graphite-600': '#707077',
        'lavender-tint': '#efecff',
        mist: '#d6e3e8',
        violet: '#6c5edc',
        'lavender-panel': '#c9c1ff',
        gold: '#ffb319',
        apricot: '#ffe1a4',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        'crawl-mint': 'var(--crawl-mint)',
        'crawl-lime': 'var(--crawl-lime)',
        'crawl-blue': 'var(--crawl-blue)',
      },
      boxShadow: {
        'hero-field': '1px 8px 30px 0 rgba(0,0,0,0.09)',
        'screenshot-inset': '0 0 24px 0 rgba(0,0,0,0.22)',
      },
      borderRadius: {
        'card-panel': '24px',
        capsule: '48px',
        input: '32px',
        inset: '12px',
        link: '5px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        system: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        footer: ['Arial', 'Helvetica', 'sans-serif'],
        display: ['"DM Sans"', 'sans-serif'],
      },
      screens: {
        xs: '420px',
      },
    },
  },
  plugins: [],
};
