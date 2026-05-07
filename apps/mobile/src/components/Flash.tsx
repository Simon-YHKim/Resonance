/**
 * Flash 메시지 — 임계 도달, 잔향가루 적립 등 일시 알림.
 *
 * useGame.flashMessage 가 set 되면 자동 표시 → 3초 후 자동 dismiss.
 */

import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useGame } from '@/store/gameStore';

export function Flash() {
  const msg = useGame((s) => s.flashMessage);
  const flash = useGame((s) => s.flash);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => flash(null), 3500);
    return () => clearTimeout(t);
  }, [msg, flash]);

  if (!msg) return null;

  return (
    <Pressable
      className="absolute top-12 left-6 right-6 bg-bg-elevated border border-resonance/50 rounded-md px-4 py-3 shadow-lg z-50"
      onPress={() => flash(null)}
    >
      <View>
        <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-0.5">
          잔향
        </Text>
        <Text className="text-fg-primary text-sm leading-relaxed">{msg}</Text>
      </View>
    </Pressable>
  );
}

/** 임계 진입 시 메시지 lookup */
export function tierEnterMessage(tier: 'descend' | 'empathy' | 'memory' | 'origin'): string | null {
  switch (tier) {
    case 'empathy':
      return '공감이 깨어났어요 — 잔잔이 30에 닿았다.';
    case 'memory':
      return '오래된 기억이 떠올라요 — 잔잔이 60에 닿았다.';
    case 'origin':
      return '원의 답이 가까워요 — 잔잔이 100에 닿았다.';
    default:
      return null;
  }
}
