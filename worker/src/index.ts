/**
 * 잔향(Resonance) Cloudflare Worker — Phase 1 placeholder
 *
 * Phase 0에서는 클라이언트가 MockLLMService로 단독 동작한다.
 * Phase 1로 진입하면 다음 엔드포인트가 추가된다 (기획서 v1.0 §2-5):
 *   POST /api/nickname/classify       → Gemini Flash-Lite
 *   POST /api/character/generate      → Claude Haiku 4.5 (cache_control)
 *   POST /api/combat/turn (SSE)       → Gemini Flash-Lite 스트리밍
 *   GET  /api/health                  → 단순 헬스체크
 *
 * 라우팅은 Cloudflare AI Gateway 경유 — 예산 캡 + 응답 캐시 (v1.0 §1-3, §5-1).
 */

import { Hono } from 'hono';

type Env = {
  // DB?: D1Database;
  // KV_NICKNAMES?: KVNamespace;
  // ANTHROPIC_API_KEY?: string;
  // GOOGLE_API_KEY?: string;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', (c) =>
  c.json({
    name: 'resonance-worker',
    phase: 0,
    status: 'placeholder',
    note: 'Real LLM endpoints land in Phase 1',
  }),
);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;
