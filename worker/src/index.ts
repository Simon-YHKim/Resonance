/**
 * 잔향(Resonance) Cloudflare Worker — Phase 1
 *
 * 엔드포인트:
 *   GET  /api/health                — 단순 헬스체크
 *   POST /api/character/analyze     — 닉네임 → user_wiki 분석·저장
 *   GET  /api/character/wiki        — 현재 사용자 wiki 조회
 *
 * Phase 1 인증: X-Dev-User-Id 헤더 (Phase 1.5 → Clerk)
 */

import { Hono } from 'hono';
import type { Bindings } from './types/bindings';
import { characterRouter } from './routes/character';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/api/health', (c) =>
  c.json({
    name: 'resonance-worker',
    phase: 1,
    status: 'live',
    endpoints: ['GET /api/health', 'POST /api/character/analyze', 'GET /api/character/wiki'],
  }),
);

app.route('/api/character', characterRouter);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((err, c) => {
  console.error('[unhandled]', err);
  return c.json({ error: 'internal', message: err.message }, 500);
});

export default app;
