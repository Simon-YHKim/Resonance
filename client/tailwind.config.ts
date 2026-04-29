import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
        },
        fg: {
          primary: 'rgb(var(--fg-primary) / <alpha-value>)',
          muted: 'rgb(var(--fg-muted) / <alpha-value>)',
          dim: 'rgb(var(--fg-dim) / <alpha-value>)',
        },
        resonance: 'rgb(var(--accent-resonance) / <alpha-value>)',
        origin: 'rgb(var(--accent-origin) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      animation: {
        'fade-in': 'fadeIn 600ms ease-out',
        'fade-in-slow': 'fadeIn 1200ms ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
        'pulse-resonance': 'pulseResonance 1800ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        /* tier 승급 — 라벤더 광량이 파동치며 사라짐 */
        pulseResonance: {
          '0%': {
            boxShadow: '0 0 0 0 rgba(184, 157, 208, 0.0)',
            opacity: '0',
            transform: 'scale(0.96)',
          },
          '20%': {
            boxShadow: '0 0 24px 6px rgba(184, 157, 208, 0.45)',
            opacity: '1',
            transform: 'scale(1)',
          },
          '100%': {
            boxShadow: '0 0 0 0 rgba(184, 157, 208, 0.0)',
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
