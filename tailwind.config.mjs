/** @type {import('tailwindcss').Config} */
// Colors come from CSS variables in src/styles/site.css, so dark mode is one swap.
export default {
  content: ['./src/**/*.{astro,html,js,ts}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        tint: 'var(--tint)',
        rule: 'var(--rule)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        measure: '68ch',
        page: '52rem',
      },
    },
  },
  plugins: [],
};
