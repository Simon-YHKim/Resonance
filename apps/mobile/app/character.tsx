/**
 * Character screen — 잔향이 본 너 (분석 결과) + 잔향 코드 + 전투 진입.
 *
 * Stage 2: nickname 분석 후 → 전투 시작 전 캐릭터 시트.
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { ResonanceApiError } from '@resonance/shared';
import { ActionButton } from '@/components/ActionButton';
import { Flash } from '@/components/Flash';
import { SafetyModal } from '@/components/SafetyModal';
import { StaminaBar } from '@/components/StaminaBar';
import { loadingForCombatStart } from '@/lib/loading-copy';
import { api } from '@/services/api';
import { useGame } from '@/store/gameStore';

/** 외형 키 → border/배경 색 매핑 (cosmetic 보유 시 적용) */
const COSMETIC_STYLES: Record<string, { border: string; tint: string }> = {
  grey: { border: 'border-fg-dim/40', tint: 'bg-bg-elevated/40' },
  fog: { border: 'border-resonance/50', tint: 'bg-resonance/10' },
};

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
        <Text className="text-fg-muted mb-3">잔향이 — 너를 아직 듣지 못했다.</Text>
        <ActionButton variant="ghost" onPress={() => router.replace('/')}>
          이름부터, 다시
        </ActionButton>
      </View>
    );
  }

  const [combatLoadingMsg, setCombatLoadingMsg] = useState('');
  const startCombat = async () => {
    setError(null);
    setCombatBusy(true);
    setCombatLoadingMsg(loadingForCombatStart());
    try {
      const res = await api.combatStart();
      setCombat(res.state);
      router.push('/combat');
    } catch (err) {
      setError(err instanceof ResonanceApiError ? err.message : '잔향이 — 네 말을 잠시 잃었어요.');
    } finally {
      setCombatBusy(false);
    }
  };

  // 인벤토리에서 cosmetic 첫 번째 → 외형 적용 (간단 fetch, character mount 시 1회)
  const cosmeticKey = useGame((s) => s.cosmeticKey);
  const setCosmeticKey = useGame((s) => s.setCosmeticKey);
  useEffect(() => {
    if (cosmeticKey !== null) return; // 이미 fetch 됨
    (async () => {
      try {
        const baseUrl = (api as unknown as { config: { baseUrl: string } }).config.baseUrl;
        const r = await fetch(`${baseUrl}/api/shop/inventory`, {
          headers: { 'X-Dev-User-Id': 'user_dev_local' },
        });
        const body = await r.json();
        if (body?.success && Array.isArray(body.items)) {
          const cos = body.items.find((it: { category: string; effect: { skin?: string } }) => it.category === 'cosmetic' && it.effect?.skin);
          setCosmeticKey(cos?.effect?.skin ?? '');
        } else {
          setCosmeticKey('');
        }
      } catch {
        setCosmeticKey('');
      }
    })();
  }, [cosmeticKey, setCosmeticKey]);

  const cosmetic = (cosmeticKey && COSMETIC_STYLES[cosmeticKey]) ?? null;

  const setAnalysis = useGame((s) => s.setAnalysis);
  const setSafetyHigh = useGame((s) => s.setSafetyHigh);
  const setStamina = useGame((s) => s.setStamina);
  const [rerolling, setRerolling] = useState(false);
  const reroll = async () => {
    if (!analysis) return;
    setError(null);
    setRerolling(true);
    try {
      const res = await api.analyzeNickname(analysis.nickname);
      const a = res.user_wiki.nickname_analysis;
      setAnalysis(a, res.user_wiki.nickname_code ?? code);
      const s = (res as unknown as { stamina?: { current: number; max_daily: number; willResetAtMs: number } }).stamina;
      if (s) setStamina(s);
      if (a.safety_concern === 'high') setSafetyHigh(true);
    } catch (err) {
      setError(err instanceof ResonanceApiError ? err.message : '잔향이 — 다시 듣기 못했어요.');
    } finally {
      setRerolling(false);
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
      <StaminaBar onShopPress={() => router.push('/shop')} />
      {/* 5 스탯 그리드 (디아블로식) */}
      {analysis.stats ? (
        <View className="border border-fg-dim/20 rounded-lg p-4 mb-4">
          <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-3">
            결의 결 — 5 스탯
          </Text>
          <View className="flex-row flex-wrap">
            {[
              ['힘', 'strength', '공격력'],
              ['민첩', 'dexterity', '회피·선제'],
              ['지능', 'intelligence', '잔잔'],
              ['에너지', 'energy', '스테미나'],
              ['체력', 'vitality', 'HP'],
            ].map(([label, key, hint]) => {
              const v = (analysis.stats as Record<string, number>)[key as string];
              const pct = Math.min(100, (v / 20) * 100);
              return (
                <View key={key as string} className="w-1/2 pr-2 mb-3">
                  <View className="flex-row justify-between items-baseline mb-1">
                    <Text className="text-fg-primary text-xs font-semibold">{label}</Text>
                    <Text className="text-resonance text-sm font-display">{v}</Text>
                  </View>
                  <View className="h-1 bg-bg-elevated rounded-full overflow-hidden">
                    <View className="h-full bg-resonance" style={{ width: `${pct}%` }} />
                  </View>
                  <Text className="text-fg-dim text-[10px] mt-0.5">{hint}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View className={`border rounded-lg p-5 mb-5 ${cosmetic ? `${cosmetic.border} ${cosmetic.tint}` : 'border-resonance/40'}`}>
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

      {cosmetic ? (
        <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-3">
          외형 · {cosmeticKey === 'fog' ? '안개 자락' : '잿빛 외투'}
        </Text>
      ) : null}

      <View className="gap-3">
        <ActionButton onPress={startCombat} disabled={isCombatBusy || rerolling}>
          {isCombatBusy ? (combatLoadingMsg || '잊혀진 자가 일어선다...') : '잊혀진 자에게 다가간다'}
        </ActionButton>
        <ActionButton variant="ghost" onPress={() => router.push('/story')}>
          스토리 1장 — 남겨진 이들 (5체)
        </ActionButton>
        <ActionButton variant="ghost" onPress={reroll} disabled={rerolling || isCombatBusy}>
          {rerolling ? '잔향이 다시 듣고 있어요...' : '잔향이 한 번 더 — 다시 듣기'}
        </ActionButton>
        <ActionButton
          variant="ghost"
          onPress={() => {
            reset();
            router.replace('/');
          }}
        >
          ← 다른 이름으로, 다시 거리에
        </ActionButton>
      </View>

      <SafetyModal />
      <Flash />
    </ScrollView>
  );
}
