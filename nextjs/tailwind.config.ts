import type { Config } from 'tailwindcss';

// Every colour is a CSS variable defined in globals.css under [data-theme=light|dark],
// so utilities like `bg-surface`, `text-text-2`, `border-border-strong`, `bg-ok-bg` follow the theme.
const tokens = [
  'bg', 'surface', 'surface-2', 'hover', 'border', 'border-strong', 'text', 'text-2', 'text-3',
  'accent', 'accent-hover', 'accent-soft', 'fence', 'sidebar',
  'ok', 'ok-bg', 'ok-dot', 'warn', 'warn-bg', 'warn-dot', 'bad', 'bad-bg', 'bad-dot',
  'info', 'info-bg', 'info-dot', 'orange', 'orange-bg', 'orange-dot',
  'violet', 'violet-bg', 'violet-dot', 'neutral', 'neutral-bg', 'neutral-dot',
  'map-bg', 'map-road', 'map-block', 'map-water', 'overlay',
];

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // The prototype relies on browser defaults + explicit inline rules, so Tailwind's reset is off
  // (turning it on shifts spacing/borders). Minimal resets live in globals.css.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: Object.fromEntries(tokens.map((t) => [t, `var(--${t})`])),
      boxShadow: { card: 'var(--shadow)', pop: 'var(--shadow-lg)' },
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
};

export default config;
