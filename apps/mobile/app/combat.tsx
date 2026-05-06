/**
 * Combat screen — 5턴 잊혀진 자 전투.
 *
 * 액션: 공격 / 대화 / 도망 + 자유 텍스트 (max 200자).
 * outcome 결정 시 → /result 자동 이동.
 */

import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { CombatAction } from '@resonance/shared';
import {
  ResonanceApiError,
  getResonanceTier,
  RESONANCE_TIER_LABELS,
} from '@resonance/shared';
import { ActionButton } from '@/components/ActionButton';
import { Flash, tierEnterMessage } from '@/components/Flash';
import { SafetyModal } from '@/components/SafetyModal';
import { loadingForCombatTurn } from '@/lib/loading-copy';
import { api } from '@/services/api';
import { useGame } from '@/store/gameStore';

export default function CombatScreen() {
  const combat = useGame((s) => s.combat);
  const setCombat = useGame((s) => s.setCombat);
  const isBusy = useGame((s) => s.isCombatBusy);
  const setBusy = useGame((s) => s.setCombatBusy);
  const setError = useGame((s) => s.setError);
  const setFinalOutcome = useGame((s) => s.setFinalOutcome);
  const setLastTurnResult = useGame((s) => s.setLastTurnResult);
  const setSafetyHigh = useGame((s) => s.setSafetyHigh);
  const error = useGame((s) => s.error);

  const [userText, setUserText] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');

  if (!combat) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center px-6">
        <Text className="text-fg-muted mb-3">거리가 — 아직 일어나지 않았다.</Text>
        <ActionButton variant="ghost" onPress={() => router.replace('/')}>
          처음으로
        </ActionButton>
      </View>
    );
  }

  const turn = async (action: CombatAction) => {
    if (!combat) return;
    setError(null);
    setBusy(true);
    setLoadingMsg(loadingForCombatTurn(action));
    const prevTier = getResonanceTier(combat.resonance);
    try {
      const res = await api.combatTurn(combat, action, userText.trim() || undefined);
      setCombat(res.state);
      setLastTurnResult(res.turnResult);
      const s = (res as unknown as { stamina?: { current: number; max_daily: number; willResetAtMs: number } }).stamina;
      if (s) useGame.getState().setStamina(s);
      // 임계 진입 flash
      const newTier = getResonanceTier(res.state.resonance);
      if (newTier !== prevTier) {
        const m = tierEnterMessage(newTier);
        if (m) useGame.getState().flash(m);
        useGame.getState().setLastTier(newTier);
      }
      // dust 적립 flash
      const dust = (res as unknown as { dustEarned?: number }).dustEarned;
      if (dust && dust > 0) {
        useGame.getState().flash(`잔향가루 +${dust} — 거리에 한 결 남았어요.`);
      }
      if (res.turnResult.safety_concern === 'high') {
        setSafetyHigh(true);
      }
      if (res.isEnded && res.outcome) {
        setFinalOutcome(res.outcome);
        router.replace('/result');
      } else {
        setUserText('');
      }
    } catch (err) {
      setError(err instanceof ResonanceApiError ? err.message : '잔향이 — 한 박자 늦게 도착해요.');
    } finally {
      setBusy(false);
    }
  };

  const enemyHpPct = Math.max(0, Math.min(100, (combat.enemy.hp / combat.enemy.maxHp) * 100));
  const playerHpPct = Math.max(0, Math.min(100, (combat.player.hp / combat.player.maxHp) * 100));

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-primary"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingTop: 48 }} keyboardShouldPersistTaps="handled">
      {/* 적 정보 */}
      <View className="mb-4 border border-fg-dim/20 rounded-lg p-4">
        <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-1">
          잊혀진 자
        </Text>
        <Text className="text-fg-primary font-display mb-2">{combat.enemy.name}</Text>
        <View className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <View className="h-full bg-danger" style={{ width: `${enemyHpPct}%` }} />
        </View>
        <Text className="text-fg-dim text-[11px] mt-1">
          HP {combat.enemy.hp} / {combat.enemy.maxHp}
        </Text>
      </View>

      {/* 플레이어 정보 */}
      <View className="mb-4 border border-resonance/30 rounded-lg p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase">너</Text>
          <Text className="text-fg-dim text-[11px]">
            턴 {combat.turn + 1} / 5 · 잔잔 {combat.resonance} ·{' '}
            <Text className="text-resonance">
              {RESONANCE_TIER_LABELS[getResonanceTier(combat.resonance)]}
            </Text>
          </Text>
        </View>
        <View className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <View className="h-full bg-resonance" style={{ width: `${playerHpPct}%` }} />
        </View>
        <Text className="text-fg-dim text-[11px] mt-1">
          HP {combat.player.hp} / {combat.player.maxHp}
        </Text>
      </View>

      {/* 로그 */}
      {combat.log.length > 0 ? (
        <View className="mb-4 border-l-2 border-fg-dim/30 pl-3 py-1">
          {combat.log.slice(-6).map((line, idx) => {
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
        <Text className="text-fg-muted text-sm italic mb-4">
          {combat.enemy.encounter}
        </Text>
      )}

      {/* 자유 텍스트 */}
      <View className="mb-4">
        <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-1">
          자유 텍스트 (선택, 최대 200자)
        </Text>
        <TextInput
          value={userText}
          onChangeText={setUserText}
          placeholder={'…너에게 한 마디 — 자유롭게.\n빈 칸도 OK.'}
          placeholderTextColor="#6B6760"
          multiline
          maxLength={200}
          editable={!isBusy}
          className="border border-bg-elevated bg-bg-secondary/40 rounded-md px-3 py-2 text-fg-primary text-sm min-h-[64px]"
        />
        <Text className="text-fg-dim text-[11px] text-right mt-1">{userText.length} / 200</Text>
      </View>

      {error ? (
        <View className="border-l-2 border-danger pl-3 py-2 mb-3">
          <Text className="text-danger text-sm">{error}</Text>
        </View>
      ) : null}

      {/* 액션 버튼 */}
      <View className="gap-3">
        <ActionButton onPress={() => turn('attack')} disabled={isBusy}>
          공격
        </ActionButton>
        <ActionButton onPress={() => turn('dialogue')} disabled={isBusy}>
          대화
        </ActionButton>
        <ActionButton variant="ghost" onPress={() => turn('flee')} disabled={isBusy}>
          도망
        </ActionButton>
        {isBusy ? (
          <View className="items-center mt-2">
            <ActivityIndicator size="small" color="#B89DD0" />
            {loadingMsg ? (
              <Text className="text-fg-dim text-xs italic mt-2">{loadingMsg}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <SafetyModal />
      <Flash />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
