/**
 * 자살예방법 §27조의8 안전 모달.
 *
 * safety_concern='high' 응답 시 표시 — 1393 안내.
 * 잔향계 톤: "잔향이 한 번 멈추고 너를 본다."
 */

import { Linking, Modal, Pressable, Text, View } from 'react-native';
import { useGame } from '@/store/gameStore';

export function SafetyModal() {
  const open = useGame((s) => s.safetyHigh);
  const setSafetyHigh = useGame((s) => s.setSafetyHigh);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setSafetyHigh(false)}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/85 px-5"
        onPress={() => setSafetyHigh(false)}
      >
        <Pressable
          className="w-full max-w-sm rounded-2xl bg-bg-elevated px-5 py-6 border border-danger/40"
          onPress={() => {
            /* swallow */
          }}
        >
          <Text className="text-fg-muted text-xs mb-1">잔향이 한 번 멈추고 너를 본다.</Text>
          <Text className="text-fg-primary text-lg font-display mb-3 leading-snug">
            너의 결을 먼저 듣고 싶어요.
          </Text>
          <Text className="text-fg-primary text-sm leading-relaxed mb-4">
            혼자 마주하기 힘든 무게가 있다면{'\n'}
            <Text className="font-semibold text-base">자살예방상담 1393</Text> (24시간 무료){'\n'}
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
              className="flex-1 rounded-md border border-fg-dim/30 items-center py-3"
              onPress={() => setSafetyHigh(false)}
            >
              <Text className="text-fg-primary">닫기</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
