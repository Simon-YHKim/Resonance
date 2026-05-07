/**
 * ActionButton — 잔향 톤 버튼.
 *
 * variant: primary (라벤더) / subtle (테두리만) / ghost (텍스트만)
 */

import { Pressable, Text } from 'react-native';

export type ActionButtonVariant = 'primary' | 'subtle' | 'ghost';

export interface ActionButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ActionButtonVariant;
  disabled?: boolean;
}

export function ActionButton({
  children,
  onPress,
  variant = 'primary',
  disabled,
}: ActionButtonProps) {
  const base =
    'px-6 py-3 rounded-md items-center justify-center transition-all duration-150';

  const styles: Record<ActionButtonVariant, { bg: string; text: string }> = {
    primary: {
      bg: 'bg-resonance/90 active:bg-resonance-deep',
      text: 'text-bg-primary font-display text-base tracking-wider',
    },
    subtle: {
      bg: 'border border-resonance/50 active:border-resonance',
      text: 'text-fg-primary font-display text-base tracking-wider',
    },
    ghost: {
      bg: 'active:bg-bg-elevated/30',
      text: 'text-fg-muted font-display text-sm',
    },
  };

  const style = styles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${base} ${style.bg} ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={style.text}>{children}</Text>
    </Pressable>
  );
}
