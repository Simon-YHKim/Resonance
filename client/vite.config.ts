/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    // MockLLMService의 인위적 지연(800~1400ms × 여러 호출)을 수용. Phase 1
    // 실 LLM 전환 시 fake timers로 정리 예정.
    testTimeout: 30000,
    // Zustand persist 등 localStorage 접근에 필요.
    environment: 'jsdom',
  },
});
