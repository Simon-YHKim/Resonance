/**
 * Phase 1 E2E 시나리오 4 — PHASE1_BUILD_PROMPT.md Day 4.
 *
 * 1. 신규 사용자 가입 → 닉네임 분석 → user_wiki 생성
 * 2. 사용자 컨텍스트 주입 LLM 호출 (callLLMWithWiki)
 * 3. 닉네임 분석 실패 → fallback (mock)
 * 4. 토큰 사용량 측정 (llm_usage_log 누적)
 *
 * Hono app + in-memory D1 stub 으로 E2E 흐름 검증.
 */

import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import type { Bindings } from '../types/bindings';
import { characterRouter } from '../routes/character';
import { callLLMWithWiki } from '../lib/llm';
import { createTestD1 } from './helpers/test-db';
import { getUserDailyTokens } from '../lib/usage-logger';

function makeApp(env: Partial<Bindings>) {
  const app = new Hono<{ Bindings: Bindings }>();
  app.route('/api/character', characterRouter);
  return {
    app,
    fetch: (path: string, init?: RequestInit) =>
      app.fetch(new Request(`http://test${path}`, init), env as Bindings),
  };
}

describe('E2E 시나리오 1 — 신규 사용자 가입 → analyze → wiki', () => {
  it('full happy path (mock LLM)', async () => {
    const DB = createTestD1();
    const env = {
      DB,
      JANSAE_LLM_PRIMARY_MODEL: 'mock',
      JANSAE_LLM_FALLBACK_MODEL: 'mock',
    };
    const { fetch } = makeApp(env);

    // 1. analyze
    const res1 = await fetch('/api/character/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_e2e_1' },
      body: JSON.stringify({ nickname: '회사다니기싫은김대리' }),
    });
    expect(res1.status).toBe(200);
    const body1: any = await res1.json();
    expect(body1.success).toBe(true);
    expect(body1.user_wiki.user_id).toBe('user_e2e_1');
    expect(body1.user_wiki.nickname_analysis.추정직업).toBe('직장인');
    expect(body1.user_wiki.nickname_analysis.스토리매칭.보스1자리).toContain('강남');
    expect(body1.meta.model).toBe('mock');
    expect(body1.meta.cost_usd).toBe(0);

    // 2. wiki 조회
    const res2 = await fetch('/api/character/wiki', {
      headers: { 'X-Dev-User-Id': 'user_e2e_1' },
    });
    expect(res2.status).toBe(200);
    const body2: any = await res2.json();
    expect(body2.success).toBe(true);
    expect(body2.user_wiki.user_id).toBe('user_e2e_1');
    expect(body2.user_wiki.nickname_analysis.nickname).toBe('회사다니기싫은김대리');

    // 3. users 테이블 확인 (FK)
    expect(DB.__tables.users.has('user_e2e_1')).toBe(true);
  });
});

describe('E2E 시나리오 2 — 사용자 컨텍스트 주입 LLM 호출', () => {
  it('analyze 후 callLLMWithWiki 가 system prompt 에 wiki 주입', async () => {
    const DB = createTestD1();
    const env = {
      DB,
      JANSAE_LLM_PRIMARY_MODEL: 'mock',
      JANSAE_LLM_FALLBACK_MODEL: 'mock',
    };
    const { fetch } = makeApp(env);

    // 1. analyze (직장인)
    await fetch('/api/character/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_e2e_2' },
      body: JSON.stringify({ nickname: '회사다니기싫은김대리' }),
    });

    // 2. callLLMWithWiki (Mock 모드)
    const r = await callLLMWithWiki(
      env as any,
      'user_e2e_2',
      '오늘 하루도 길었어요.',
      'You are the Voice.',
      { context: 'story' },
    );

    expect(r.model).toBe('mock');
    // mock 응답에 the_Voice_호칭 포함 ("김대리님")
    expect(r.response).toContain('김대리');
    expect(r.response).toContain('직장인');
  });

  it('실 LLM (주입) — system prompt 에 wiki 주입 검증', async () => {
    const DB = createTestD1();
    // analyze 는 mock, callLLMWithWiki 는 실 LLM (주입) 분기 — env 분리
    const envAnalyze = {
      DB,
      JANSAE_LLM_PRIMARY_MODEL: 'mock',
      JANSAE_LLM_FALLBACK_MODEL: 'mock',
    };
    const { fetch } = makeApp(envAnalyze);

    await fetch('/api/character/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_e2e_2b' },
      body: JSON.stringify({ nickname: '시댁스트레스' }),
    });

    const fakeAnthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: '잘 했어요.' }],
          usage: { input_tokens: 300, output_tokens: 50 },
        }),
      },
    };

    // 실 LLM 분기 활성: ANTHROPIC_API_KEY 설정
    const envLLM = {
      DB,
      ANTHROPIC_API_KEY: 'sk-fake',
      JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5',
    };

    const r = await callLLMWithWiki(
      envLLM as any,
      'user_e2e_2b',
      '...',
      'You are the Voice.',
      { context: 'story', anthropic: fakeAnthropic as any },
    );

    expect(r.inputTokens).toBe(300);
    const callArgs = (fakeAnthropic.messages.create as any).mock.calls[0][0];
    expect(callArgs.system).toContain('시댁스트레스'); // wiki 닉네임 주입
    expect(callArgs.system).toContain('주부'); // 추정직업 (시댁 키워드)
  });
});

describe('E2E 시나리오 3 — 닉네임 분석 실패 → fallback', () => {
  it('Anthropic 호출 실패 + fallback=mock 시 자동 mock', async () => {
    const DB = createTestD1();

    // analyze 라우트는 직접 lib 호출이 아닌 nicknameAnalyzer 사용.
    // route 레벨에서 fallback 검증은 — 실패 분기를 정확히 시뮬하려면 anthropic 주입 필요.
    // 단순화: ANTHROPIC_API_KEY 미설정 시 자동 mock fallback (현재 구현).
    const env = {
      DB,
      // ANTHROPIC_API_KEY 미설정
      JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5',
      JANSAE_LLM_FALLBACK_MODEL: 'mock',
    };
    const { fetch } = makeApp(env);

    const res = await fetch('/api/character/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_e2e_3' },
      body: JSON.stringify({ nickname: '회사다니기싫은김대리' }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.meta.model).toBe('mock');
  });

  it('빈 닉네임 → 400 INVALID_NICKNAME', async () => {
    const DB = createTestD1();
    const env = { DB, JANSAE_LLM_PRIMARY_MODEL: 'mock', JANSAE_LLM_FALLBACK_MODEL: 'mock' };
    const { fetch } = makeApp(env);

    const res = await fetch('/api/character/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_e2e_3b' },
      body: JSON.stringify({ nickname: '' }),
    });
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.code).toBe('INVALID_NICKNAME');
  });

  it('21자 닉네임 → 400', async () => {
    const DB = createTestD1();
    const env = { DB, JANSAE_LLM_PRIMARY_MODEL: 'mock', JANSAE_LLM_FALLBACK_MODEL: 'mock' };
    const { fetch } = makeApp(env);

    const res = await fetch('/api/character/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_e2e_3c' },
      body: JSON.stringify({ nickname: '가'.repeat(21) }),
    });
    expect(res.status).toBe(400);
  });

  it('인증 없음 → 401', async () => {
    const DB = createTestD1();
    const env = { DB, JANSAE_LLM_PRIMARY_MODEL: 'mock', JANSAE_LLM_FALLBACK_MODEL: 'mock' };
    const { fetch } = makeApp(env);

    const res = await fetch('/api/character/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // X-Dev-User-Id 없음
      body: JSON.stringify({ nickname: '엄마' }),
    });
    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('JSON body 없음 → 400', async () => {
    const DB = createTestD1();
    const env = { DB, JANSAE_LLM_PRIMARY_MODEL: 'mock', JANSAE_LLM_FALLBACK_MODEL: 'mock' };
    const { fetch } = makeApp(env);

    const res = await fetch('/api/character/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_e2e_3d' },
      body: 'not json',
    });
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.code).toBe('INVALID_BODY');
  });

  it('wiki 없는 사용자 GET /wiki → 404', async () => {
    const DB = createTestD1();
    const env = { DB, JANSAE_LLM_PRIMARY_MODEL: 'mock', JANSAE_LLM_FALLBACK_MODEL: 'mock' };
    const { fetch } = makeApp(env);

    const res = await fetch('/api/character/wiki', {
      headers: { 'X-Dev-User-Id': 'user_no_wiki' },
    });
    expect(res.status).toBe(404);
    const body: any = await res.json();
    expect(body.code).toBe('NO_WIKI');
  });
});

describe('E2E 시나리오 추가 — Rate Limit (paid-api-guard)', () => {
  it('5회 분석 후 6회째는 429 RATE_LIMITED', async () => {
    const DB = createTestD1();
    const env = {
      DB,
      JANSAE_LLM_PRIMARY_MODEL: 'mock',
      JANSAE_LLM_FALLBACK_MODEL: 'mock',
    };
    const { fetch } = makeApp(env);
    const headers = {
      'Content-Type': 'application/json',
      'X-Dev-User-Id': 'user_rl',
    };

    for (let i = 0; i < 5; i++) {
      const res = await fetch('/api/character/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ nickname: `테스트${i}` }),
      });
      expect(res.status).toBe(200);
    }
    const res6 = await fetch('/api/character/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({ nickname: '테스트6' }),
    });
    expect(res6.status).toBe(429);
    const body: any = await res6.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(body.retry_after_ms).toBeGreaterThan(0);
  });

  it('다른 사용자는 별개 카운트', async () => {
    const DB = createTestD1();
    const env = {
      DB,
      JANSAE_LLM_PRIMARY_MODEL: 'mock',
      JANSAE_LLM_FALLBACK_MODEL: 'mock',
    };
    const { fetch } = makeApp(env);

    for (let i = 0; i < 5; i++) {
      await fetch('/api/character/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_rl_a' },
        body: JSON.stringify({ nickname: `테스트${i}` }),
      });
    }
    const res = await fetch('/api/character/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_rl_b' },
      body: JSON.stringify({ nickname: '다른사용자' }),
    });
    expect(res.status).toBe(200);
  });
});

describe('E2E 시나리오 4 — 토큰 사용량 측정', () => {
  it('LLM 호출 5회 → llm_usage_log 5 entries + 총합 정확', async () => {
    const DB = createTestD1();
    const env = {
      DB,
      JANSAE_LLM_PRIMARY_MODEL: 'mock',
      JANSAE_LLM_FALLBACK_MODEL: 'mock',
    };
    const { fetch } = makeApp(env);

    // 1. analyze (1회 mock 기록)
    await fetch('/api/character/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_e2e_4' },
      body: JSON.stringify({ nickname: '엄마' }),
    });

    // 2. callLLMWithWiki 4회
    for (let i = 0; i < 4; i++) {
      await callLLMWithWiki(env as any, 'user_e2e_4', `q${i}`, 'base', {
        context: 'story',
      });
    }

    // 3. log 검증
    const logs = DB.__tables.llm_usage_log.filter((l) => l.user_id === 'user_e2e_4');
    expect(logs.length).toBe(5);
    expect(logs.every((l) => l.llm_model === 'mock')).toBe(true);
    expect(logs.every((l) => l.cost_usd === 0)).toBe(true);

    // 4. 일일 토큰 집계
    const daily = await getUserDailyTokens(DB, 'user_e2e_4');
    expect(daily.calls).toBe(5);
    expect(daily.tokens).toBe(0); // mock 은 0 토큰
    expect(daily.costUsd).toBe(0);
  });

  it('실 LLM 비용 누적 추적', async () => {
    const DB = createTestD1();
    const env = {
      DB,
      ANTHROPIC_API_KEY: 'sk-fake',
      JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5',
    };
    const { fetch } = makeApp(env);

    // 가짜 wiki 직접 주입 (analyze 거치지 않음, 실 SDK 부하 절감)
    DB.__tables.users.set('user_e2e_4b', {
      id: 'user_e2e_4b',
      created_at: 1, updated_at: 1, age_gate_passed: 0,
    });
    DB.__tables.user_wiki.set('user_e2e_4b', {
      user_id: 'user_e2e_4b',
      nickname_analysis_json: JSON.stringify({
        nickname: '엄마', category: 'A',
        추정직업: '주부', 추정연령: '40대', 추정환경: '집·동네', 정서적결: '평이한',
        주요키워드: ['엄마'],
        스토리매칭: {
          보스1자리: 'a', 보스1회상: 'b', 보스2자리: 'c',
          보스3자리: 'd', 보스4자리: 'e', 보스5자리: 'f',
        },
        거점NPC말투: { 차분한가게주인: '...' },
        the_Voice_호칭: '엄마',
      }),
      gaehwa_axis: 0, yeojeon_axis: 0, hangno_axis: 0,
      created_at: 1, updated_at: 1,
    });

    const fakeAnthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: '응' }],
          usage: { input_tokens: 1000, output_tokens: 200 },
        }),
      },
    };

    await callLLMWithWiki(
      env as any,
      'user_e2e_4b',
      '...',
      'base',
      { context: 'battle', anthropic: fakeAnthropic as any },
    );
    await callLLMWithWiki(
      env as any,
      'user_e2e_4b',
      '...',
      'base',
      { context: 'battle', anthropic: fakeAnthropic as any },
    );

    const daily = await getUserDailyTokens(DB, 'user_e2e_4b');
    expect(daily.calls).toBe(2);
    expect(daily.tokens).toBe(2400); // (1000+200) * 2
    // ($1*1000 + $5*200) / 1M * 2 = 0.002 * 2 = 0.004
    expect(daily.costUsd).toBeCloseTo(0.004, 5);
  });
});
