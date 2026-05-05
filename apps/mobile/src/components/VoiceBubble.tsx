/**
 * VoiceBubble — the Voice 발화 표시.
 *
 * 잔향 다크 파스텔 톤. 좌측 라벤더 보더 + 흐릿한 글자.
 * web/iOS/Android 동일 스타일 (NativeWind 4).
 */

import { Text, View } from 'react-native';

export interface VoiceBubbleProps {
  children: React.ReactNode;
  /** 첫 발화 여부 — 강조 색 */
  primary?: boolean;
}

export function VoiceBubble({ children, primary }: VoiceBubbleProps) {
  return (
    <View
      className={
        'border-l-2 pl-3 py-2 my-2 ' +
        (primary ? 'border-resonance' : 'border-resonance/40')
      }
    >
      <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-1">
        목소리
      </Text>
      <Text
        className={
          'text-base leading-relaxed ' +
          (primary ? 'text-fg-primary' : 'text-fg-muted')
        }
      >
        {children}
      </Text>
    </View>
  );
}
