/**
 * Title screen — 잔향 모바일·웹 진입점.
 *
 * 잔향 다크 파스텔 톤. "이름을 가진 자" CTA + the Voice 첫 발화.
 *
 * web export 시: /index.html (Cloudflare Pages 정적 라우팅)
 * 모바일: Expo Router 의 default route
 */

import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { VoiceBubble } from '@/components/VoiceBubble';

export default function TitleScreen() {
  return (
    <View className="flex-1 bg-bg-primary px-6 py-12 justify-between">
      {/* 상단 — 게임 정체성 */}
      <View className="mt-16 items-center">
        <Text className="text-fg-dim text-[10px] tracking-[0.4em] uppercase mb-3">
          殘響
        </Text>
        <Text className="font-display text-resonance text-5xl mb-2">잔향</Text>
        <Text className="text-fg-muted text-sm italic">
          Echoes of a Forgotten Self
        </Text>
      </View>

      {/* 중앙 — the Voice 첫 발화 */}
      <View className="my-8">
        <VoiceBubble primary>...기억나요?</VoiceBubble>
        <Text className="text-fg-muted text-base leading-loose mt-3 italic">
          잔향이 — 너를 기다린다.{'\n'}
          이름을 한 줄, 입력해줘.
        </Text>
      </View>

      {/* 하단 — CTA */}
      <View className="mb-8 gap-3">
        <ActionButton onPress={() => router.push('/nickname')}>
          이름을 가진 사람
        </ActionButton>
        <Text className="text-fg-dim text-[11px] text-center mt-2 leading-relaxed">
          한 번 입력한 이름은 — 잔향에 영원히 남는다.
        </Text>
      </View>
    </View>
  );
}
