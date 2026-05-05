/**
 * Nickname input screen — POST /api/character/analyze 호출.
 *
 * 1. 사용자 닉네임 입력 (1~20자)
 * 2. "잔향에 들어간다" → Worker analyze API
 * 3. 응답 처리 — 200 / 400 / 429 / 500 분기
 * 4. 성공 시 → /character (Phase 2 에서 구현)
 */

import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { ResonanceApiError } from '@resonance/shared';
import { ActionButton } from '@/components/ActionButton';
import { VoiceBubble } from '@/components/VoiceBubble';
import { api } from '@/services/api';
import { useGame } from '@/store/gameStore';

export default function NicknameScreen() {
  const [nickname, setNickname] = useState('');
  const setAnalyzing = useGame((s) => s.setAnalyzing);
  const setAnalysis = useGame((s) => s.setAnalysis);
  const setError = useGame((s) => s.setError);
  const isAnalyzing = useGame((s) => s.isAnalyzing);
  const error = useGame((s) => s.error);

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length === 0 || trimmed.length > 20) {
      setError('닉네임은 1~20자여야 합니다.');
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const res = await api.analyzeNickname(trimmed);
      setAnalysis(res.user_wiki.nickname_analysis);
      // Phase 2: router.push('/character');
      // Phase 1: 임시로 첫 분석 결과 직접 표시
    } catch (err) {
      if (err instanceof ResonanceApiError) {
        if (err.code === 'RATE_LIMITED') {
          setError(`시간당 5회까지 가능합니다. ${Math.round((err.retryAfterMs ?? 0) / 60000)}분 후 다시.`);
        } else {
          setError(err.message);
        }
      } else {
        setError('네트워크 오류가 발생했습니다.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const analysis = useGame((s) => s.analysis);

  return (
    <View className="flex-1 bg-bg-primary px-6 py-12">
      <View className="mt-12">
        <VoiceBubble primary>...너의 이름을, 한 줄로 들려줘.</VoiceBubble>
        <Text className="text-fg-dim text-xs mt-2 italic leading-relaxed">
          한 번 입력한 이름은 — 잔향이 영원히 기억한다.{'\n'}
          (한글·영문·숫자, 1~20자)
        </Text>
      </View>

      <View className="mt-10">
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="...회사다니기싫은김대리"
          placeholderTextColor="#6B6760"
          maxLength={20}
          editable={!isAnalyzing}
          className="border border-bg-elevated bg-bg-secondary/40 rounded-md px-4 py-3 text-fg-primary text-lg font-display"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Text className="text-fg-dim text-[11px] text-right mt-2">
          {nickname.length} / 20
        </Text>
      </View>

      {error && (
        <View className="mt-4 border-l-2 border-danger pl-3 py-2">
          <Text className="text-danger text-sm">{error}</Text>
        </View>
      )}

      {analysis && (
        <View className="mt-6 border border-resonance/40 rounded-md p-4">
          <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-2">
            잔향이 본 너
          </Text>
          <Text className="text-fg-primary font-display text-base mb-1">
            {analysis.the_Voice_호칭}
          </Text>
          <Text className="text-fg-muted text-sm italic mb-2">
            {analysis.추정직업} · {analysis.추정연령} · {analysis.정서적결}
          </Text>
          <Text className="text-fg-muted text-xs leading-relaxed">
            보스 1: {analysis.스토리매칭.보스1자리}
            {'\n'}보스 2: {analysis.스토리매칭.보스2자리}
            {'\n'}보스 3: {analysis.스토리매칭.보스3자리}
          </Text>
        </View>
      )}

      <View className="mt-auto mb-4 gap-3">
        <ActionButton
          onPress={handleSubmit}
          disabled={isAnalyzing || nickname.trim().length === 0}
        >
          {isAnalyzing ? '분석 중...' : '잔향에 들어간다'}
        </ActionButton>
        {isAnalyzing && (
          <ActivityIndicator size="small" color="#B89DD0" className="my-2" />
        )}
        <ActionButton variant="ghost" onPress={() => router.back()}>
          ← 처음으로
        </ActionButton>
      </View>
    </View>
  );
}
