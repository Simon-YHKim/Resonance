/**
 * Expo Router root layout — 잔향 모바일·웹 통합 entry.
 *
 * - SafeArea + StatusBar (다크 테마)
 * - NativeWind global.css 로드
 * - Stack navigation
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/styles/global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0F0E14" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F0E14' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="nickname" />
        <Stack.Screen name="character" />
        <Stack.Screen name="combat" />
        <Stack.Screen name="result" />
        <Stack.Screen name="shop" />
      </Stack>
    </SafeAreaProvider>
  );
}
