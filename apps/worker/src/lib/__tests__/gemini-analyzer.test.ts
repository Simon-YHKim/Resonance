import { describe, it, expect, vi } from 'vitest';
import { analyzeWithGemini, calcGeminiCost } from '../gemini-analyzer';
import { LLMError } from '../nickname-analyzer';

const SYSTEM_PROMPT = '당신은 잔향 닉네임 분석가...';

const validBody = {
  nickname: '엄마',
  category: 'A',
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

function fakeFetch(response: { status: number; body: unknown; ok?: boolean }) {
  return vi.fn(
    async (_url: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
      new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
}

describe('calcGeminiCost', () => {
  it('1M / 1M = $0.5', () => {
    expect(calcGeminiCost(1_000_000, 1_000_000)).toBeCloseTo(0.5, 5);
  });

  it('500 / 200 ≈ tiny', () => {
    // ($0.10 * 500 + $0.40 * 200) / 1M = (50 + 80) / 1M = 0.00013
    expect(calcGeminiCost(500, 200)).toBeCloseTo(0.00013, 8);
  });
});

describe('analyzeWithGemini — 정상 응답', () => {
  it('candidates[0].content.parts[0].text 파싱', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: {
        candidates: [
          {
            content: { parts: [{ text: JSON.stringify(validBody) }] },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: { promptTokenCount: 500, candidatesTokenCount: 200 },
      },
    });

    const r = await analyzeWithGemini('엄마', SYSTEM_PROMPT, 'fake_key', { fetch });
    expect(r.model).toBe('gemini-flash-lite-latest');
    expect(r.analysis.category).toBe('A');
    expect(r.analysis.추정직업).toBe('주부');
    expect(r.inputTokens).toBe(500);
    expect(r.outputTokens).toBe(200);
    expect(r.costUsd).toBeGreaterThan(0);
  });

  it('REST URL 에 model + key 포함, body 에 systemInstruction', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: {
        candidates: [{ content: { parts: [{ text: JSON.stringify(validBody) }] } }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 },
      },
    });

    await analyzeWithGemini('엄마', SYSTEM_PROMPT, 'AIza_xxx', { fetch });

    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toContain('gemini-flash-lite-latest');
    expect(String(url)).toContain('AIza_xxx');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.systemInstruction.parts[0].text).toBe(SYSTEM_PROMPT);
    expect(body.contents[0].parts[0].text).toContain('엄마');
    expect(body.generationConfig.responseMimeType).toBe('application/json');
  });

  it('model override (gemini-2.5-flash-lite)', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: {
        candidates: [{ content: { parts: [{ text: JSON.stringify(validBody) }] } }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      },
    });
    const r = await analyzeWithGemini('엄마', SYSTEM_PROMPT, 'k', {
      fetch,
      model: 'gemini-2.5-flash-lite',
    });
    expect(r.model).toBe('gemini-2.5-flash-lite');
    const [url] = fetch.mock.calls[0];
    expect(String(url)).toContain('gemini-2.5-flash-lite');
  });

  it('닉네임 강제 교정 (LLM 응답이 다른 닉네임이라도)', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: {
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ ...validBody, nickname: 'WRONG' }) }],
            },
          },
        ],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      },
    });
    const r = await analyzeWithGemini('엄마', SYSTEM_PROMPT, 'k', { fetch });
    expect(r.analysis.nickname).toBe('엄마');
  });

  it('markdown ```json 감싼 응답 파싱', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: {
        candidates: [
          {
            content: {
              parts: [{ text: '```json\n' + JSON.stringify(validBody) + '\n```' }],
            },
          },
        ],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
      },
    });
    const r = await analyzeWithGemini('엄마', SYSTEM_PROMPT, 'k', { fetch });
    expect(r.analysis.category).toBe('A');
  });
});

describe('analyzeWithGemini — 오류', () => {
  it('400 에러 응답 → LLMError', async () => {
    const fetch = fakeFetch({
      status: 400,
      body: { error: { message: 'API key not valid', code: 400 } },
    });
    await expect(
      analyzeWithGemini('엄마', SYSTEM_PROMPT, 'bad_key', { fetch }),
    ).rejects.toThrow(LLMError);
  });

  it('candidates 비어있음 → LLMError', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: { candidates: [], usageMetadata: {} },
    });
    await expect(
      analyzeWithGemini('엄마', SYSTEM_PROMPT, 'k', { fetch }),
    ).rejects.toThrow('비어 있습니다');
  });

  it('JSON 파싱 실패 → LLMError', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: {
        candidates: [{ content: { parts: [{ text: 'not a json' }] } }],
        usageMetadata: {},
      },
    });
    await expect(
      analyzeWithGemini('엄마', SYSTEM_PROMPT, 'k', { fetch }),
    ).rejects.toThrow('파싱 실패');
  });

  it('schema 위반 → LLMError', async () => {
    const fetch = fakeFetch({
      status: 200,
      body: {
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ nickname: '엄마', category: 'X' }) }],
            },
          },
        ],
        usageMetadata: {},
      },
    });
    await expect(
      analyzeWithGemini('엄마', SYSTEM_PROMPT, 'k', { fetch }),
    ).rejects.toThrow('스키마 위반');
  });

  it('네트워크 오류 → LLMError', async () => {
    const fetch = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(
      analyzeWithGemini('엄마', SYSTEM_PROMPT, 'k', {
        fetch: fetch as unknown as typeof globalThis.fetch,
      }),
    ).rejects.toThrow('네트워크 오류');
  });
});
