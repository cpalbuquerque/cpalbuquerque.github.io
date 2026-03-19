/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary palette — Salinas Valley earth tones + scientific precision
        soil:     { DEFAULT: '#2c1f0e', light: '#4a3420' },
        grove:    { DEFAULT: '#1e3a27', light: '#2d5a3d', muted: '#4a7560' },
        sage:     { DEFAULT: '#7a9e84', light: '#a8c4ac' },
        straw:    { DEFAULT: '#f0ead8', light: '#faf7f0' },
        terracotta: { DEFAULT: '#b85c2c', light: '#d4764a' },
        gold:     { DEFAULT: '#9a7c3a', light: '#c4a55a' },
        fog:      { DEFAULT: '#e8ede9', light: '#f4f7f4' },
        ink:      { DEFAULT: '#1a1a1a', light: '#2d2d2d' },
      },
      fontFamily: {
        display:  ['"Playfair Display"', 'Georgia', 'serif'],
        serif:    ['"Source Serif 4"', 'Georgia', 'serif'],
        sans:     ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:     ['"DM Mono"', 'monospace'],
      },
      fontSize: {
        'hero': ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display': ['clamp(1.8rem, 3vw, 2.8rem)', { lineHeight: '1.2' }],
      },
      maxWidth: {
        'prose-xl': '75ch',
        'site':     '1200px',
      },
      spacing: {
        'section': '6rem',
        'section-sm': '4rem',
      },
    },
  },
  plugins: [],
};
