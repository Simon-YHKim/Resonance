import type { ButtonHTMLAttributes, ReactNode, MouseEventHandler } from 'react';
import { haptic as triggerHaptic } from '@/utils/haptic';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'subtle';
  /** 터치 시 햅틱 강도 — primary 기본 'soft', 그 외 'tap'. 'none'으로 비활성. */
  feedback?: 'tap' | 'soft' | 'firm' | 'none';
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
  feedback,
  className = '',
  children,
  onClick,
  ...rest
}: Props) {
  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (rest.disabled) return;
    const strength = feedback ?? (variant === 'primary' ? 'soft' : 'tap');
    if (strength !== 'none') triggerHaptic(strength);
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full px-6 py-4
        display-text text-base tracking-wider
        rounded-sm
        transition-all duration-150
        active:scale-[0.98]
        disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANTS[variant]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
}
