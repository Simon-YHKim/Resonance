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
import { cors } from 'hono/cors';
import type { Bindings } from './types/bindings';
import { characterRouter } from './routes/character';
import { combatRouter } from './routes/combat';
import { shopRouter } from './routes/shop';
import { storyRouter } from './routes/story';
import { MOBILE_HTML } from './ui/mobile-html';

const app = new Hono<{ Bindings: Bindings }>();

// CORS — Expo Web (Cloudflare Pages) + Expo dev (localhost) 허용.
// 핵심 보안: X-Dev-User-Id 위조는 IP rate limit + budget cap 으로 방어 (이전 commit).
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      // 같은 worker.dev 도메인 (워커 자체 호출)
      if (origin.endsWith('.workers.dev')) return origin;
      // Cloudflare Pages (production + preview)
      if (origin.endsWith('.pages.dev')) return origin;
      // Expo dev (localhost · 192.168.* 등)
      if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(origin)) {
        return origin;
      }
      return null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Dev-User-Id', 'Authorization'],
    maxAge: 86400,
    credentials: false,
  }),
);

// 모바일 친화 HTML UI — wrangler dev tunnel 또는 Cloudflare 배포 시 즉시 동작
app.get('/', (c) =>
  c.html(MOBILE_HTML, 200, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }),
);

app.get('/api/health', (c) =>
  c.json({
    name: 'resonance-worker',
    phase: 1,
    status: 'live',
    endpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/character/analyze',
      'GET /api/character/wiki',
      'GET /api/character/stamina',
      'GET /api/character/code',
      'GET /api/character/by-code/:code',
      'POST /api/combat/start',
      'POST /api/combat/turn',
      'GET /api/shop/items',
      'GET /api/shop/inventory',
      'POST /api/shop/purchase',
      'POST /api/story/start',
      'POST /api/story/turn',
      'GET /api/story/progress',
    ],
  }),
);

app.route('/api/character', characterRouter);
app.route('/api/combat', combatRouter);
app.route('/api/shop', shopRouter);
app.route('/api/story', storyRouter);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((err, c) => {
  console.error('[unhandled]', err);
  return c.json({ error: 'internal', message: err.message }, 500);
});

export default app;
