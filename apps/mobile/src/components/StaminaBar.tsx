/**
 * 스테미나 게이지 — Phase 2 BM.
 *
 * current / max_daily 표시 + 자정 reset 안내.
 */

import { Pressable, Text, View } from 'react-native';
import { useGame } from '@/store/gameStore';

interface Props {
  onShopPress?: () => void;
}

function fmtTime(ms: number): string {
  const diffMs = ms - Date.now();
  if (diffMs <= 0) return '곧 회복';
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  return h > 0 ? `${h}시간 ${m}분 후` : `${m}분 후`;
}

export function StaminaBar({ onShopPress }: Props) {
  const stamina = useGame((s) => s.stamina);
  if (!stamina) return null;
  const pct = Math.max(0, Math.min(100, (stamina.current / stamina.max_daily) * 100));

  return (
    <View className="flex-row items-center gap-3 mb-3">
      <View className="flex-1">
        <View className="flex-row justify-between items-baseline mb-1">
          <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase">잔향</Text>
          <Text className="text-fg-muted text-[11px]">
            {stamina.current} / {stamina.max_daily} · {fmtTime(stamina.willResetAtMs)} 회복
          </Text>
        </View>
        <View className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <View
            className={pct > 30 ? 'h-full bg-resonance' : 'h-full bg-danger'}
            style={{ width: `${pct}%` }}
          />
        </View>
      </View>
      {onShopPress ? (
        <Pressable
          onPress={onShopPress}
          className="border border-fg-dim/30 rounded-md px-3 py-1.5"
        >
          <Text className="text-fg-primary text-xs">상점</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
