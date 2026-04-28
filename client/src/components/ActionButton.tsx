import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'subtle';
  children: ReactNode;
}

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'bg-resonance/90 text-bg-primary hover:bg-resonance active:bg-resonance/80 disabled:bg-bg-elevated disabled:text-fg-dim',
  ghost:
    'bg-bg-secondary border border-bg-elevated text-fg-primary hover:border-resonance/60 active:bg-bg-elevated disabled:text-fg-dim disabled:border-bg-elevated',
  subtle:
    'bg-transparent text-fg-muted hover:text-fg-primary disabled:text-fg-dim',
};

export function ActionButton({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`
        w-full px-6 py-4
        display-text text-base tracking-wider
        rounded-sm
        transition-colors duration-200
        disabled:cursor-not-allowed
        ${VARIANTS[variant]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
}
