const c = (v) => `rgb(var(--${v}) / <alpha-value>)`
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { bg: c('bg'), surface: c('surface'), accent: c('accent'), accent2: c('accent2'), ink: c('text'), muted: c('muted') },
      fontFamily: { display: ['Orbitron', 'Rajdhani', 'sans-serif'], sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
