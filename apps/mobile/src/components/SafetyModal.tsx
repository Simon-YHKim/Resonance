/**
 * 자살예방법 §27조의8 안전 모달.
 *
 * safety_concern='high' 응답 시 표시 — 1393 안내.
 * 잔향계 톤: "잔향이 한 번 멈추고 너를 본다."
 */

import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, Text, View } from 'react-native';
import { useGame } from '@/store/gameStore';

const DWELL_SECONDS = 5;

/**
 * 자살예방법 §27조의8 — safety_concern='high' 시 1393 안내.
 *
 * 보호:
 * - 5초 dwell (닫기 버튼 비활성)
 * - 복수 채널 (1393 / 1388 청소년 / 1577-0199 정신건강)
 * - 배경 클릭으로 닫기 X (실수 방어)
 */
export function SafetyModal() {
  const open = useGame((s) => s.safetyHigh);
  const setSafetyHigh = useGame((s) => s.setSafetyHigh);
  const [seconds, setSeconds] = useState(DWELL_SECONDS);

  useEffect(() => {
    if (!open) return;
    setSeconds(DWELL_SECONDS);
    const iv = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(iv);
  }, [open]);

  const canClose = seconds <= 0;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => canClose && setSafetyHigh(false)}
    >
      <View className="flex-1 items-center justify-center bg-black/85 px-5">
        <View className="w-full max-w-sm rounded-2xl bg-bg-elevated px-5 py-6 border border-danger/40">
          <Text className="text-fg-muted text-xs mb-1">잔향이 한 번 멈추고 너를 본다.</Text>
          <Text className="text-fg-primary text-lg font-display mb-3 leading-snug">
            너의 결을 먼저 듣고 싶어요.
          </Text>
          <Text className="text-fg-primary text-sm leading-relaxed mb-4">
            혼자 마주하기 힘든 무게가 있다면{'\n'}
            <Text className="font-semibold text-base">자살예방상담 1393</Text> (24시간 무료){'\n'}
            <Text className="text-fg-muted text-xs">
              청소년: 1388 · 정신건강: 1577-0199
            </Text>
            {'\n'}
            <Text className="text-fg-dim text-xs">
              — 잔향계 너머의 사람도 너의 잔향을 듣는다.
            </Text>
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              className="flex-1 rounded-md bg-resonance items-center py-3"
              onPress={() => Linking.openURL('tel:1393')}
            >
              <Text className="text-bg-primary font-semibold">1393 전화하기</Text>
            </Pressable>
            <Pressable
              className={`flex-1 rounded-md border items-center py-3 ${
                canClose ? 'border-fg-dim/30' : 'border-fg-dim/10'
              }`}
              disabled={!canClose}
              onPress={() => canClose && setSafetyHigh(false)}
            >
              <Text className={canClose ? 'text-fg-primary' : 'text-fg-dim'}>
                {canClose ? '닫기' : `닫기 (${seconds})`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
