/**
 * Worker API client 인스턴스 — apps/mobile 진입점.
 *
 * baseUrl 은 .env 또는 expo-constants 의 extra 에서 주입.
 * 개발: http://localhost:8787 (wrangler dev)
 * 프로덕션: https://resonance-worker.<account>.workers.dev
 */

import Constants from 'expo-constants';
import { ResonanceClient } from '@resonance/shared';

const baseUrl =
  (Constants.expoConfig?.extra?.workerBaseUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_WORKER_BASE_URL ??
  'http://localhost:8787';

/**
 * Phase 1: X-Dev-User-Id 헤더 (개발 friendly).
 * Phase 1.5+: Clerk JWT 로 교체.
 */
const devUserId =
  process.env.EXPO_PUBLIC_DEV_USER_ID ?? 'user_dev_local';

export const api = new ResonanceClient({
  baseUrl,
  devUserId,
});
