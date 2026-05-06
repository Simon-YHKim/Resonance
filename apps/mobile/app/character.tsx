/**
 * Character screen — 잔향이 본 너 (분석 결과) + 잔향 코드 + 전투 진입.
 *
 * Stage 2: nickname 분석 후 → 전투 시작 전 캐릭터 시트.
 */

import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { ResonanceApiError } from '@resonance/shared';
import { ActionButton } from '@/components/ActionButton';
import { SafetyModal } from '@/components/SafetyModal';
import { api } from '@/services/api';
import { useGame } from '@/store/gameStore';

export default function CharacterScreen() {
  const analysis = useGame((s) => s.analysis);
  const code = useGame((s) => s.nicknameCode);
  const setCombat = useGame((s) => s.setCombat);
  const setError = useGame((s) => s.setError);
  const isCombatBusy = useGame((s) => s.isCombatBusy);
  const setCombatBusy = useGame((s) => s.setCombatBusy);
  const error = useGame((s) => s.error);
  const reset = useGame((s) => s.reset);

  if (!analysis) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center px-6">
        <Text className="text-fg-muted">잔향이 비어있다. 처음으로.</Text>
        <ActionButton variant="ghost" onPress={() => router.replace('/')}>
          처음으로
        </ActionButton>
      </View>
    );
  }

  const startCombat = async () => {
    setError(null);
    setCombatBusy(true);
    try {
      const res = await api.combatStart();
      setCombat(res.state);
      router.push('/combat');
    } catch (err) {
      setError(err instanceof ResonanceApiError ? err.message : '네트워크 오류');
    } finally {
      setCombatBusy(false);
    }
  };

  const shareCode = async () => {
    if (!code) return;
    try {
      await Share.share({
        message: `잔향계에서 — 내 코드 ${code}. 너가 입력하면 너만 보이는 잔향이 깨어난다.`,
      });
    } catch {
      /* dismiss */
    }
  };

  const meta = [analysis.추정직업, analysis.추정연령, analysis.정서적결]
    .filter(Boolean)
    .join(' · ');

  return (
    <ScrollView className="flex-1 bg-bg-primary" contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
      <View className="border border-resonance/40 rounded-lg p-5 mb-5">
        <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-2">
          잔향이 본 너
        </Text>
        <Text className="text-fg-primary font-display text-2xl mb-1">
          {analysis.the_Voice_호칭}
        </Text>
        {meta ? (
          <Text className="text-fg-muted text-xs italic mb-3">{meta}</Text>
        ) : null}

        {analysis.safety_concern === 'high' ? (
          <View className="border border-danger/40 bg-danger/5 rounded-md p-3 mb-3">
            <Text className="text-danger font-semibold mb-1">
              잔향이 한 번 멈추고 너를 본다.
            </Text>
            <Text className="text-fg-muted text-xs leading-relaxed">
              힘들면 자살예방상담 1393 (24시간 무료).
            </Text>
          </View>
        ) : null}

        <Text className="text-fg-primary text-base leading-relaxed mb-4">
          {analysis.description}
        </Text>

        {analysis.주요키워드 && analysis.주요키워드.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 mb-3">
            {analysis.주요키워드.map((k) => (
              <Text
                key={k}
                className="text-resonance text-xs border border-resonance/40 rounded-full px-2.5 py-1"
              >
                {k}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      {code ? (
        <View className="border border-fg-dim/20 rounded-lg p-4 mb-5">
          <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-2">
            내 잔향 코드
          </Text>
          <View className="flex-row items-center gap-3">
            <Text className="text-fg-primary text-2xl font-mono tracking-widest">
              {code}
            </Text>
            <Pressable
              className="border border-fg-dim/30 rounded-md px-3 py-1.5"
              onPress={shareCode}
            >
              <Text className="text-fg-primary text-xs">공유</Text>
            </Pressable>
          </View>
          <Text className="text-fg-dim text-[11px] mt-2 leading-relaxed">
            친구가 이 코드로 너의 잔향을 들여다본다.
          </Text>
        </View>
      ) : null}

      <View className="border-l-2 border-resonance/60 pl-4 mb-6">
        <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-1">
          목소리
        </Text>
        <Text className="text-fg-primary leading-relaxed">
          …거리의 끝에서, 누군가 너를 기다린다.
        </Text>
        <Text className="text-fg-muted text-sm mt-1 leading-relaxed">
          잊혀진 자가 일어선다. 가까이 가볼래?
        </Text>
      </View>

      {error ? (
        <View className="border-l-2 border-danger pl-3 py-2 mb-3">
          <Text className="text-danger text-sm">{error}</Text>
        </View>
      ) : null}

      <View className="gap-3">
        <ActionButton onPress={startCombat} disabled={isCombatBusy}>
          {isCombatBusy ? '잊혀진 자가 일어선다...' : '잊혀진 자에게 다가간다'}
        </ActionButton>
        <ActionButton
          variant="ghost"
          onPress={() => {
            reset();
            router.replace('/');
          }}
        >
          ← 다른 닉네임 시도
        </ActionButton>
      </View>

      <SafetyModal />
    </ScrollView>
  );
}
