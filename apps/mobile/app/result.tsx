/**
 * Result screen — 5턴 전투 결말.
 *
 * outcome: victory / defeat / fled / stalemate
 */

import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { SafetyModal } from '@/components/SafetyModal';
import { useGame } from '@/store/gameStore';

const TITLES: Record<string, string> = {
  victory: '잊혀진 자가 — 천천히 무너진다',
  defeat: '거리가 너를 — 받아내지 못했다',
  fled: '너는 거리를 떠났다',
  stalemate: '안개가 둘 사이에 머물렀다',
};

const TEXTS: Record<string, string> = {
  victory:
    '잊혀진 자가 너에게 무언가를 떨어뜨린다 — 너만이 알아보는 것을. 잔향이 거리를 따라 길게 늘어선다.',
  defeat:
    '너는 그것을 기억한다. 잔향이 너를 한 박자 늦게 보낸다.',
  fled:
    '도망친 자리는 한 박자 더 길게 너를 따라온다. 너는 그것을 이제 안다.',
  stalemate:
    '5턴, 너희 둘은 같은 안개에 잠시 머물렀다. 다음 거리가 너를 기다린다.',
};

export default function ResultScreen() {
  const combat = useGame((s) => s.combat);
  const outcome = useGame((s) => s.finalOutcome);
  const reset = useGame((s) => s.reset);
  const resetCombat = useGame((s) => s.resetCombat);

  if (!combat || !outcome) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center px-6">
        <Text className="text-fg-muted mb-3">잔향이 아직 — 머물 자리를 못 찾았다.</Text>
        <ActionButton variant="ghost" onPress={() => router.replace('/')}>
          처음으로
        </ActionButton>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg-primary" contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
      <View className="border border-resonance/50 rounded-lg p-5 mb-5">
        <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-2">
          결말
        </Text>
        <Text className="text-fg-primary font-display text-xl mb-3 leading-snug">
          {TITLES[outcome] ?? '잔향이 멈췄다'}
        </Text>
        <Text className="text-fg-primary text-sm leading-relaxed">
          {TEXTS[outcome] ?? ''}
        </Text>
      </View>

      <View className="mb-5">
        <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-2">
          최종 상태
        </Text>
        <Text className="text-fg-primary text-sm">
          너의 HP {combat.player.hp}/{combat.player.maxHp} · 잊혀진 자 HP {combat.enemy.hp}/
          {combat.enemy.maxHp} · 잔잔 {combat.resonance}
        </Text>
      </View>

      <View className="border-l-2 border-fg-dim/30 pl-3 py-1 mb-6">
        <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-2">
          전투의 결
        </Text>
        {combat.log.map((line, idx) => {
          const isEcho = line.startsWith('  ↳');
          return (
            <Text
              key={idx}
              className={
                isEcho
                  ? 'text-fg-dim text-xs italic mb-1 leading-relaxed'
                  : 'text-fg-primary text-sm mb-1 leading-relaxed'
              }
            >
              {line}
            </Text>
          );
        })}
      </View>

      <View className="gap-3">
        <ActionButton
          onPress={() => {
            resetCombat();
            router.replace('/character');
          }}
        >
          다시 잊혀진 자에게
        </ActionButton>
        <ActionButton
          variant="ghost"
          onPress={() => {
            reset();
            router.replace('/');
          }}
        >
          ← 처음으로
        </ActionButton>
      </View>

      <SafetyModal />
    </ScrollView>
  );
}
