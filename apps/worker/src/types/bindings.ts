/**
 * Cloudflare Workers Env bindings
 *
 * wrangler.toml 의 [[d1_databases]] / [vars] / [[kv_namespaces]] 와 매칭.
 * 시크릿 (ANTHROPIC_API_KEY 등) 은 wrangler secret put 또는 .dev.vars 로 주입.
 */

export interface Bindings {
  /** D1 database — wrangler d1 migrations apply 후 활성화 */
  DB: D1Database;

  /** Phase 1 — primary LLM 모델명 (vars) */
  JANSAE_LLM_PRIMARY_MODEL: string;
  /** Phase 1 — fallback (mock) */
  JANSAE_LLM_FALLBACK_MODEL: string;

  /** Anthropic API key — .dev.vars / wrangler secret put */
  ANTHROPIC_API_KEY?: string;

  /** Google AI Studio API key — .dev.vars / wrangler secret put */
  GEMINI_API_KEY?: string;

  /** paid-api-guard: 사용자당 24h 누적 LLM 비용 캡 (USD) — 기본 0.10 */
  USER_DAILY_BUDGET_USD?: string;
  /** paid-api-guard: 전 시스템 24h 누적 LLM 비용 캡 (USD) — 기본 1.00 */
  DAILY_BUDGET_USD?: string;
}
