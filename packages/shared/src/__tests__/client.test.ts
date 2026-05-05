import { describe, it, expect, vi } from 'vitest';
import { ResonanceClient, ResonanceApiError, validateAnalyze } from '../client';

const sampleAnalysis = {
  nickname: '엄마',
  category: 'A' as const,
  추정직업: '주부',
  추정연령: '40대',
  추정환경: '집·동네',
  정서적결: '평이한',
  주요키워드: ['엄마'],
  스토리매칭: {
    보스1자리: '동네 마트',
    보스1회상: '가족 식탁',
    보스2자리: '동네 공원',
    보스3자리: '학원',
    보스4자리: '초등학교 골목',
    보스5자리: '회색 운동장',
  },
  거점NPC말투: { 차분한가게주인: '수고했어요. 엄마.' },
  the_Voice_호칭: '엄마',
};

function fakeFetch(response: { status: number; body: unknown }) {
  return vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
      new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
}

describe('ResonanceClient — analyzeNickname', () => {
  it('200 success', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: {
        success: true,
        user_wiki: { user_id: 'user_1', nickname_analysis: sampleAnalysis },
        meta: { model: 'mock', input_tokens: 0, output_tokens: 0, cost_usd: 0 },
      },
    });
    const client = new ResonanceClient({
      baseUrl: 'http://test',
      devUserId: 'user_1',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    const r = await client.analyzeNickname('엄마');
    expect(r.success).toBe(true);
    expect(r.user_wiki.nickname_analysis.category).toBe('A');
    expect(r.meta.model).toBe('mock');

    // 헤더 확인
    const callArgs = fetch.mock.calls[0];
    expect(callArgs[0]).toBe('http://test/api/character/analyze');
    expect((callArgs[1] as RequestInit).method).toBe('POST');
    const headers = (callArgs[1] as RequestInit).headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Dev-User-Id']).toBe('user_1');
  });

  it('400 INVALID_NICKNAME → ResonanceApiError', async () => {
    const fetch = fakeFetch({
      status: 400,
      body: { success: false, error: '닉네임은 1~20자여야 합니다.', code: 'INVALID_NICKNAME' },
    });
    const client = new ResonanceClient({
      baseUrl: 'http://test',
      devUserId: 'user_1',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    try {
      await client.analyzeNickname('');
      expect.fail('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ResonanceApiError);
      expect((err as ResonanceApiError).code).toBe('INVALID_NICKNAME');
      expect((err as ResonanceApiError).status).toBe(400);
    }
  });

  it('429 RATE_LIMITED → retry_after_ms', async () => {
    const fetch = fakeFetch({
      status: 429,
      body: {
        success: false,
        error: '시간당 5회까지 가능합니다.',
        code: 'RATE_LIMITED',
        retry_after_ms: 3600000,
      },
    });
    const client = new ResonanceClient({
      baseUrl: 'http://test',
      devUserId: 'user_1',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    try {
      await client.analyzeNickname('하늘');
      expect.fail('should throw');
    } catch (err) {
      const e = err as ResonanceApiError;
      expect(e.code).toBe('RATE_LIMITED');
      expect(e.retryAfterMs).toBe(3600000);
    }
  });

  it('authToken 헤더 (Phase 1.5+ 시뮬)', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: {
        success: true,
        user_wiki: { user_id: 'user_clerk', nickname_analysis: sampleAnalysis },
        meta: { model: 'mock', input_tokens: 0, output_tokens: 0, cost_usd: 0 },
      },
    });
    const client = new ResonanceClient({
      baseUrl: 'http://test',
      authToken: 'jwt_token_123',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    await client.analyzeNickname('엄마');
    const headers = (fetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer jwt_token_123');
  });
});

describe('ResonanceClient — getWiki', () => {
  it('200 success', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: {
        success: true,
        user_wiki: {
          user_id: 'user_1',
          nickname_analysis: sampleAnalysis,
          milestones: [],
          gaehwa_axis: 0,
          yeojeon_axis: 0,
          hangno_axis: 0,
          axis_locked_at: null,
          created_at: 1,
          updated_at: 1,
        },
      },
    });
    const client = new ResonanceClient({
      baseUrl: 'http://test',
      devUserId: 'user_1',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    const r = await client.getWiki();
    expect(r.user_wiki.user_id).toBe('user_1');
  });

  it('404 NO_WIKI', async () => {
    const fetch = fakeFetch({
      status: 404,
      body: { success: false, error: 'wiki 없음', code: 'NO_WIKI' },
    });
    const client = new ResonanceClient({
      baseUrl: 'http://test',
      devUserId: 'user_1',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    await expect(client.getWiki()).rejects.toThrow(ResonanceApiError);
  });
});

describe('ResonanceClient — health', () => {
  it('OK', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: { name: 'resonance-worker', phase: 1, status: 'live', endpoints: [] },
    });
    const client = new ResonanceClient({
      baseUrl: 'http://test',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    const r = await client.health();
    expect(r.phase).toBe(1);
  });

  it('500 — HEALTH_DOWN', async () => {
    const fetch = vi.fn(async () => new Response('err', { status: 500 }));
    const client = new ResonanceClient({
      baseUrl: 'http://test',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    await expect(client.health()).rejects.toThrow('health check 500');
  });
});

describe('validateAnalyze', () => {
  it('통과', () => {
    const body = {
      success: true as const,
      user_wiki: { user_id: 'u', nickname_analysis: sampleAnalysis },
      meta: { model: 'mock', input_tokens: 0, output_tokens: 0, cost_usd: 0 },
    };
    expect(validateAnalyze(body).category).toBe('A');
  });
});
