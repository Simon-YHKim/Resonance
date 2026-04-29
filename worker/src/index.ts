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

/* CORS — GitHub Pages 배포본이 워커를 부를 수 있도록.
 * Phase 1 실제 도메인 확정 시 origin allowlist 좁힘. */
app.use('/api/*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
  await next();
});

app.get('/api/health', (c) =>
  c.json({
    name: 'resonance-worker',
    phase: 0,
    status: 'placeholder',
    note: 'Real LLM endpoints land in Phase 1',
    /* Phase 0: 클라이언트 단독 동작 — 이 워커는 헬스체크만.
     * Phase 1 진입 시 endpoints.available 가 채워진다. */
    endpoints: {
      available: ['/api/health'],
      planned: [
        'POST /api/nickname/classify',
        'POST /api/character/generate',
        'POST /api/combat/turn',
      ],
    },
    /* 안전 정책 — 자살예방법 §19조의2 (2년 / 2천만원).
     * D 카테고리 닉네임은 자해 방법·도구·과정 직접 묘사 절대 금지.
     * 클라이언트 룰북: client/src/services/llm/mockData/nicknameCategoryRules.ts */
    safety: {
      D_category: 'no_self_harm_depiction',
      hotline_KR: '1393',
    },
    /* 클라이언트 산출물 (참고용) */
    client: {
      pages_url: 'https://simon-yhkim.github.io/Resonance/',
    },
    server_time: new Date().toISOString(),
  }),
);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;
