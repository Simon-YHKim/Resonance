/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    /* PWA — 오프라인 캐싱 + 설치 가능성. Phase 0는 정적 자원만 캐시
     * (실 LLM 없으니 모든 자원이 정적). Phase 1+ /api/* 는 명시적으로
     * NetworkOnly 처리. */
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      includeAssets: ['icon.svg'],
      // index.html에 이미 manifest 링크 있음 — 충돌 방지
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Google Fonts CSS
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Google Fonts 파일 (woff2 등)
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // 미래 워커 API — 절대 캐시하지 않음 (LLM 응답은 실시간)
            urlPattern: /\/api\/.*$/,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        // dev 서버에서 SW 활성화 X — HMR 충돌 방지. 빌드 산출물에서만.
        enabled: false,
      },
    }),
  ],
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
