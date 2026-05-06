/**
 * Story screen — 5체 순차 스토리 모드.
 *
 * combat.tsx 와 차이:
 *   - stamina X
 *   - storyStart/storyTurn API
 *   - 보스 격파 시 nextEnemy 로 자동 진입 (state 교체)
 *   - 잔잔(殘殘) 누적 이월 → 5체 격파 시 reconciled/resealed 분기
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { CombatAction, CombatState } from '@resonance/shared';
import { ResonanceApiError } from '@resonance/shared';
import { ActionButton } from '@/components/ActionButton';
import { SafetyModal } from '@/components/SafetyModal';
import { api } from '@/services/api';
import { useGame } from '@/store/gameStore';

const RECONCILE_THRESHOLD = 100;

interface Progress {
  chapter: string;
  current_boss: number;
  cumulative_resonance: number;
  status: string;
}

export default function StoryScreen() {
  const setSafetyHigh = useGame((s) => s.setSafetyHigh);
  const [state, setState] = useState<CombatState | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userText, setUserText] = useState('');
  const [storyOutcome, setStoryOutcome] = useState<string | null>(null);
  const [dustTotal, setDustTotal] = useState(0);

  useEffect(() => {
    (async () => {
      setBusy(true);
      try {
        const res = await api.storyStart('ch1');
        setState(res.state);
        setProgress(res.progress);
        setChapterTitle(res.chapterTitle);
      } catch (err) {
        if (err instanceof ResonanceApiError && err.code === 'CHAPTER_LOCKED') {
          setError('잔향이 — 아직 그 챕터를 듣지 않았어요. 상점에서 새겨주세요.');
        } else {
          setError(err instanceof ResonanceApiError ? err.message : '잔향이 — 거리에 닿지 못했어요.');
        }
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  if (busy && !state) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator color="#B89DD0" />
      </View>
    );
  }

  if (error && !state) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center px-6">
        <Text className="text-fg-muted text-center mb-4 leading-relaxed">{error}</Text>
        <ActionButton onPress={() => router.replace('/shop')}>상점으로</ActionButton>
        <ActionButton variant="ghost" onPress={() => router.replace('/character')}>
          ← 거리로 돌아가기
        </ActionButton>
      </View>
    );
  }

  const turn = async (action: CombatAction) => {
    if (!state) return;
    setError(null);
    setBusy(true);
    try {
      const res = await api.storyTurn(state, action, 'ch1', userText.trim() || undefined);
      if (res.turnResult.safety_concern === 'high') setSafetyHigh(true);
      setProgress(res.progress);
      setDustTotal((d) => d + (res.dustEarned ?? 0));

      if (res.nextEnemy && res.nextEnemy.starterState) {
        // 다음 보스 자동 진입
        setState(res.nextEnemy.starterState);
        setUserText('');
      } else if (res.isEnded) {
        setState(res.state);
        setStoryOutcome(res.storyOutcome);
      } else {
        setState(res.state);
        setUserText('');
      }
    } catch (err) {
      setError(err instanceof ResonanceApiError ? err.message : '잔향이 — 한 박자 늦게 도착해요.');
    } finally {
      setBusy(false);
    }
  };

  if (storyOutcome) {
    const titles: Record<string, string> = {
      reconciled: '화해 — 잔향이 깊게 머물렀다',
      resealed: '재봉인 — 다시 안개 속으로',
      failed: '거리가 — 아직 너를 받지 못했다',
      fled: '도주 — 잔향이 한 발짝 멀어진다',
    };
    const texts: Record<string, string> = {
      reconciled:
        '5체의 잊혀진 자가 너의 결을 받아냈다. 그들은 안개 속으로 사라지지 않았다 — 너의 잔향에 머물렀다.',
      resealed:
        '5체를 격파했지만, 그들은 다시 안개 속으로 봉인된다. 잔잔이 깊어지면 다음번엔 화해할 수 있을지도.',
      failed:
        '거리가 너를 받아내지 못했다. 1체부터 다시 — 너의 결이 더 깊어질 때까지.',
      fled:
        '너는 거리를 떠났다. 다음 발걸음은 너의 것.',
    };
    return (
      <ScrollView className="flex-1 bg-bg-primary" contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
        <View className="border border-resonance/50 rounded-lg p-5 mb-5">
          <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-2">
            결말 · 스토리 1장
          </Text>
          <Text className="text-fg-primary font-display text-xl mb-3 leading-snug">
            {titles[storyOutcome] ?? '잔향이 멈췄다'}
          </Text>
          <Text className="text-fg-primary text-sm leading-relaxed">
            {texts[storyOutcome] ?? ''}
          </Text>
        </View>
        {dustTotal > 0 ? (
          <View className="border-l-2 border-resonance/60 pl-3 py-2 mb-5">
            <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-1">
              적립
            </Text>
            <Text className="text-fg-primary text-sm">잔향가루 +{dustTotal}</Text>
          </View>
        ) : null}
        <ActionButton onPress={() => router.replace('/character')}>
          ← 거리로 돌아가기
        </ActionButton>
        <SafetyModal />
      </ScrollView>
    );
  }

  if (!state || !progress) return null;

  const enemyHpPct = Math.max(0, Math.min(100, (state.enemy.hp / state.enemy.maxHp) * 100));
  const playerHpPct = Math.max(0, Math.min(100, (state.player.hp / state.player.maxHp) * 100));
  const reconcileProgress = Math.min(100, (state.resonance / RECONCILE_THRESHOLD) * 100);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-primary"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingTop: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4">
          <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-1">
            {chapterTitle} · {progress.current_boss}/5
          </Text>
          {/* 잔잔 누적 게이지 (화해 임계 100) */}
          <View className="flex-row justify-between items-baseline mb-1">
            <Text className="text-fg-muted text-[11px]">
              잔잔 {state.resonance} / {RECONCILE_THRESHOLD} (화해 임계)
            </Text>
          </View>
          <View className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <View className="h-full bg-resonance" style={{ width: `${reconcileProgress}%` }} />
          </View>
        </View>

        <View className="mb-4 border border-fg-dim/20 rounded-lg p-4">
          <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-1">
            잊혀진 자 · 제 {progress.current_boss} 체
          </Text>
          <Text className="text-fg-primary font-display mb-2">{state.enemy.name}</Text>
          <View className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <View className="h-full bg-danger" style={{ width: `${enemyHpPct}%` }} />
          </View>
          <Text className="text-fg-dim text-[11px] mt-1">
            HP {state.enemy.hp} / {state.enemy.maxHp}
          </Text>
        </View>

        <View className="mb-4 border border-resonance/30 rounded-lg p-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase">너</Text>
            <Text className="text-fg-dim text-[11px]">턴 {state.turn + 1} / 5</Text>
          </View>
          <View className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <View className="h-full bg-resonance" style={{ width: `${playerHpPct}%` }} />
          </View>
          <Text className="text-fg-dim text-[11px] mt-1">
            HP {state.player.hp} / {state.player.maxHp}
          </Text>
        </View>

        {state.log.length > 0 ? (
          <View className="mb-4 border-l-2 border-fg-dim/30 pl-3 py-1">
            {state.log.slice(-6).map((line, idx) => {
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
        ) : (
          <Text className="text-fg-muted text-sm italic mb-4 leading-relaxed">
            {state.enemy.encounter}
          </Text>
        )}

        <View className="mb-4">
          <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-1">
            자유 텍스트 (선택, 최대 200자)
          </Text>
          <TextInput
            value={userText}
            onChangeText={setUserText}
            placeholder={'…너에게 한 마디 — 자유롭게.'}
            placeholderTextColor="#6B6760"
            multiline
            maxLength={200}
            editable={!busy}
            className="border border-bg-elevated bg-bg-secondary/40 rounded-md px-3 py-2 text-fg-primary text-sm min-h-[64px]"
          />
          <Text className="text-fg-dim text-[11px] text-right mt-1">{userText.length} / 200</Text>
        </View>

        {error ? (
          <View className="border-l-2 border-danger pl-3 py-2 mb-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <View className="gap-3">
          <ActionButton onPress={() => turn('attack')} disabled={busy}>
            공격
          </ActionButton>
          <ActionButton onPress={() => turn('dialogue')} disabled={busy}>
            대화
          </ActionButton>
          <ActionButton variant="ghost" onPress={() => turn('flee')} disabled={busy}>
            도망
          </ActionButton>
          {busy ? <ActivityIndicator size="small" color="#B89DD0" className="mt-2" /> : null}
        </View>

        <SafetyModal />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
