import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          elevated: 'var(--bg-elevated)',
        },
        fg: {
          primary: 'var(--fg-primary)',
          muted: 'var(--fg-muted)',
          dim: 'var(--fg-dim)',
        },
        resonance: 'var(--accent-resonance)',
        origin: 'var(--accent-origin)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      animation: {
        'fade-in': 'fadeIn 600ms ease-out',
        'fade-in-slow': 'fadeIn 1200ms ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
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
      },
    },
  },
  plugins: [],
} satisfies Config;
