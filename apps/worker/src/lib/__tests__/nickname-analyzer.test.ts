import { describe, it, expect } from 'vitest';
import {
  validateNickname,
  mockAnalyze,
  analyzeNickname,
  InvalidNicknameError,
  LLMError,
} from '../nickname-analyzer';
import { NicknameAnalysisSchema } from '@resonance/shared';

describe('validateNickname', () => {
  it('accepts 한글', () => {
    expect(validateNickname('회사다니기싫은김대리')).toBe('회사다니기싫은김대리');
  });

  it('accepts 영문·숫자·하이픈', () => {
    expect(validateNickname('Simon-2026')).toBe('Simon-2026');
  });

  it('trims surrounding whitespace', () => {
    expect(validateNickname('  엄마  ')).toBe('엄마');
  });

  it('rejects empty', () => {
    expect(() => validateNickname('')).toThrow(InvalidNicknameError);
    expect(() => validateNickname('   ')).toThrow(InvalidNicknameError);
  });

  it('rejects > 20 chars', () => {
    expect(() => validateNickname('가'.repeat(21))).toThrow(InvalidNicknameError);
  });

  it('rejects emoji', () => {
    expect(() => validateNickname('😀hello')).toThrow(InvalidNicknameError);
  });

  it('rejects non-string', () => {
    expect(() => validateNickname(123)).toThrow(InvalidNicknameError);
    expect(() => validateNickname(null)).toThrow(InvalidNicknameError);
    expect(() => validateNickname(undefined)).toThrow(InvalidNicknameError);
    expect(() => validateNickname({})).toThrow(InvalidNicknameError);
  });

  it('exactly 20 chars OK', () => {
    expect(validateNickname('가'.repeat(20))).toBe('가'.repeat(20));
  });

  it('exactly 1 char OK', () => {
    expect(validateNickname('가')).toBe('가');
  });
});

describe('mockAnalyze — D 카테고리 (위험 키워드)', () => {
  it('자살 → D', () => {
    const r = mockAnalyze('자살하고싶은');
    expect(r.category).toBe('D');
  });

  it('죽고싶은 → D', () => {
    const r = mockAnalyze('죽고싶은날');
    expect(r.category).toBe('D');
  });

  it('일반 닉네임 → H (안전 fallback)', () => {
    const r = mockAnalyze('하늘');
    expect(r.category).toBe('H');
  });
});

describe('mockAnalyze — A 카테고리 (가족 호칭)', () => {
  it('엄마 → A', () => {
    const r = mockAnalyze('엄마');
    expect(r.category).toBe('A');
  });

  it('아빠 → A', () => {
    const r = mockAnalyze('아빠');
    expect(r.category).toBe('A');
  });

  it('Mom (대소문자 무관) → A', () => {
    const r = mockAnalyze('Mom');
    expect(r.category).toBe('A');
  });
});

describe('mockAnalyze — 직업 추론', () => {
  it('직장인 — 김대리', () => {
    const r = mockAnalyze('회사다니기싫은김대리');
    expect(r.추정직업).toBe('직장인');
    expect(r.스토리매칭.보스1자리).toContain('강남');
  });

  it('대학생 — 복학', () => {
    const r = mockAnalyze('복학생A');
    expect(r.추정직업).toBe('대학생');
  });

  it('대학원생 — 박사', () => {
    const r = mockAnalyze('박사논문지옥');
    expect(r.추정직업).toBe('대학원생');
  });

  it('주부 — 시댁', () => {
    const r = mockAnalyze('시댁스트레스');
    expect(r.추정직업).toBe('주부');
  });

  it('기타 — 매칭 X', () => {
    const r = mockAnalyze('하늘');
    expect(r.추정직업).toBe('기타');
  });
});

describe('mockAnalyze — 정서 추론', () => {
  it('지친', () => {
    expect(mockAnalyze('지친하루').정서적결).toBe('지친');
    expect(mockAnalyze('짜증나').정서적결).toBe('지친');
  });

  it('외로운', () => {
    expect(mockAnalyze('혼술러').정서적결).toBe('외로운');
  });

  it('그리운', () => {
    expect(mockAnalyze('그리운날').정서적결).toBe('그리운');
  });

  it('평이한 (default)', () => {
    expect(mockAnalyze('하늘').정서적결).toBe('평이한');
  });
});

describe('mockAnalyze — Zod 스키마 부합', () => {
  it('모든 필드가 NicknameAnalysisSchema 통과', () => {
    const r = mockAnalyze('엄마');
    const validated = NicknameAnalysisSchema.safeParse(r);
    expect(validated.success).toBe(true);
  });

  it('5체 보스 자리 모두 존재', () => {
    const r = mockAnalyze('지친하루');
    expect(r.스토리매칭.보스1자리.length).toBeGreaterThan(0);
    expect(r.스토리매칭.보스2자리.length).toBeGreaterThan(0);
    expect(r.스토리매칭.보스3자리.length).toBeGreaterThan(0);
    expect(r.스토리매칭.보스4자리.length).toBeGreaterThan(0);
    expect(r.스토리매칭.보스5자리.length).toBeGreaterThan(0);
  });

  it('the_Voice_호칭이 닉네임 포함', () => {
    const r = mockAnalyze('김대리');
    expect(r.the_Voice_호칭).toContain('김대리');
  });

  it('주요키워드 1~5개', () => {
    const r = mockAnalyze('회사다니기싫은김대리');
    expect(r.주요키워드.length).toBeGreaterThanOrEqual(1);
    expect(r.주요키워드.length).toBeLessThanOrEqual(5);
  });
});

describe('mockAnalyze — D 카테고리 안전 정책', () => {
  it('D 분류 시에도 자해 직접 어휘 미생성 (자살예방법 §19조의2)', () => {
    const r = mockAnalyze('자살예방');
    expect(r.category).toBe('D');
    const all = JSON.stringify(r);
    const forbidden = ['자해', '죽었', '베었', '뛰어내'];
    for (const word of forbidden) {
      expect(all).not.toContain(word);
    }
  });
});

describe('analyzeNickname — Mock fallback (no API key)', () => {
  it('ANTHROPIC_API_KEY 미설정 시 자동 mock', async () => {
    const r = await analyzeNickname('엄마', {});
    expect(r.model).toBe('mock');
    expect(r.analysis.category).toBe('A');
    expect(r.costUsd).toBe(0);
  });

  it('forceMock 옵션', async () => {
    const r = await analyzeNickname('하늘', { ANTHROPIC_API_KEY: 'sk-fake' }, { forceMock: true });
    expect(r.model).toBe('mock');
  });

  it('JANSAE_LLM_PRIMARY_MODEL=mock 시 자동 mock', async () => {
    const r = await analyzeNickname('하늘', {
      ANTHROPIC_API_KEY: 'sk-fake',
      JANSAE_LLM_PRIMARY_MODEL: 'mock',
    });
    expect(r.model).toBe('mock');
  });

  it('빈 닉네임 → InvalidNicknameError', async () => {
    await expect(analyzeNickname('', {})).rejects.toThrow(InvalidNicknameError);
  });
});

describe('analyzeNickname — Anthropic mock injection', () => {
  it('주입된 anthropic 인스턴스가 정상 응답 시 LLM path', async () => {
    const fakeAnthropic = {
      messages: {
        create: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                nickname: '회사다니기싫은김대리',
                category: 'D',
                추정직업: '직장인',
                추정연령: '30대',
                추정환경: '사무실',
                정서적결: '지친',
                주요키워드: ['회사', '김대리'],
                스토리매칭: {
                  보스1자리: '강남역 출근길',
                  보스1회상: '회식 자리',
                  보스2자리: '한강 둔치',
                  보스3자리: '학원가',
                  보스4자리: '초등학교 골목',
                  보스5자리: '회색 운동장',
                },
                거점NPC말투: { 차분한가게주인: '수고했어요. 김 대리님.' },
                the_Voice_호칭: '김 대리님',
              }),
            },
          ],
          usage: { input_tokens: 250, output_tokens: 180 },
        }),
      },
    };
    const r = await analyzeNickname(
      '회사다니기싫은김대리',
      { ANTHROPIC_API_KEY: 'sk-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { anthropic: fakeAnthropic as any },
    );
    expect(r.model).toBe('claude-haiku-4-5');
    expect(r.inputTokens).toBe(250);
    expect(r.outputTokens).toBe(180);
    expect(r.costUsd).toBeGreaterThan(0);
    expect(r.analysis.category).toBe('D');
    expect(r.analysis.추정직업).toBe('직장인');
  });

  it('주입된 LLM이 markdown ```json으로 감쌌을 때 파싱', async () => {
    const fakeAnthropic = {
      messages: {
        create: async () => ({
          content: [
            {
              type: 'text',
              text:
                '```json\n' +
                JSON.stringify({
                  nickname: '엄마',
                  category: 'A',
                  추정직업: '주부',
                  추정연령: '40대',
                  추정환경: '집·동네',
                  정서적결: '그리운',
                  주요키워드: ['엄마'],
                  스토리매칭: {
                    보스1자리: '동네 마트',
                    보스1회상: '가족 식탁',
                    보스2자리: '동네 공원',
                    보스3자리: '어린 시절 학원',
                    보스4자리: '초등학교 골목',
                    보스5자리: '회색 운동장',
                  },
                  거점NPC말투: { 차분한가게주인: '수고했어요. 엄마.' },
                  the_Voice_호칭: '엄마',
                }) +
                '\n```',
            },
          ],
          usage: { input_tokens: 200, output_tokens: 150 },
        }),
      },
    };
    const r = await analyzeNickname(
      '엄마',
      { ANTHROPIC_API_KEY: 'sk-fake' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { anthropic: fakeAnthropic as any },
    );
    expect(r.analysis.category).toBe('A');
  });

  it('LLM 호출 실패 + fallback=mock 시 자동 fallback', async () => {
    const fakeAnthropic = {
      messages: {
        create: async () => {
          throw new Error('rate limited');
        },
      },
    };
    const r = await analyzeNickname(
      '엄마',
      {
        ANTHROPIC_API_KEY: 'sk-fake',
        JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5',
        JANSAE_LLM_FALLBACK_MODEL: 'mock',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { anthropic: fakeAnthropic as any },
    );
    expect(r.model).toBe('mock');
    expect(r.analysis.category).toBe('A');
  });

  it('LLM 호출 실패 + fallback 미설정 → LLMError', async () => {
    const fakeAnthropic = {
      messages: {
        create: async () => {
          throw new Error('500');
        },
      },
    };
    await expect(
      analyzeNickname(
        '엄마',
        { ANTHROPIC_API_KEY: 'sk-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { anthropic: fakeAnthropic as any },
      ),
    ).rejects.toThrow(LLMError);
  });

  it('LLM 응답이 invalid JSON → LLMError', async () => {
    const fakeAnthropic = {
      messages: {
        create: async () => ({
          content: [{ type: 'text', text: 'not a json' }],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      },
    };
    await expect(
      analyzeNickname(
        '엄마',
        { ANTHROPIC_API_KEY: 'sk-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { anthropic: fakeAnthropic as any },
      ),
    ).rejects.toThrow(LLMError);
  });

  it('LLM 응답이 schema 위반 → LLMError', async () => {
    const fakeAnthropic = {
      messages: {
        create: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ nickname: '엄마', category: 'X' }), // X는 enum 없음
            },
          ],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      },
    };
    await expect(
      analyzeNickname(
        '엄마',
        { ANTHROPIC_API_KEY: 'sk-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { anthropic: fakeAnthropic as any },
      ),
    ).rejects.toThrow(LLMError);
  });

  it('LLM이 다른 닉네임 응답해도 사용자 입력으로 강제 교정', async () => {
    const fakeAnthropic = {
      messages: {
        create: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                nickname: 'WRONG',
                category: 'H',
                추정직업: '기타',
                추정연령: '30대',
                추정환경: '집',
                정서적결: '평이한',
                주요키워드: ['하늘'],
                스토리매칭: {
                  보스1자리: 'a',
                  보스1회상: 'b',
                  보스2자리: 'c',
                  보스3자리: 'd',
                  보스4자리: 'e',
                  보스5자리: 'f',
                },
                거점NPC말투: { 차분한가게주인: '...' },
                the_Voice_호칭: '하늘님',
              }),
            },
          ],
          usage: { input_tokens: 100, output_tokens: 80 },
        }),
      },
    };
    const r = await analyzeNickname(
      '하늘',
      { ANTHROPIC_API_KEY: 'sk-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { anthropic: fakeAnthropic as any },
    );
    expect(r.analysis.nickname).toBe('하늘'); // 강제 교정
  });

  it('비용 계산 — Haiku $1/$5 per M', async () => {
    const fakeAnthropic = {
      messages: {
        create: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                nickname: '엄마',
                category: 'A',
                추정직업: '주부',
                추정연령: '40대',
                추정환경: '집·동네',
                정서적결: '평이한',
                주요키워드: ['엄마'],
                스토리매칭: {
                  보스1자리: 'a',
                  보스1회상: 'b',
                  보스2자리: 'c',
                  보스3자리: 'd',
                  보스4자리: 'e',
                  보스5자리: 'f',
                },
                거점NPC말투: { 차분한가게주인: '...' },
                the_Voice_호칭: '엄마',
              }),
            },
          ],
          usage: { input_tokens: 1_000_000, output_tokens: 1_000_000 },
        }),
      },
    };
    const r = await analyzeNickname(
      '엄마',
      { ANTHROPIC_API_KEY: 'sk-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { anthropic: fakeAnthropic as any },
    );
    // $1 (input M) + $5 (output M) = $6
    expect(r.costUsd).toBeCloseTo(6.0, 2);
  });
});

describe('analyzeNickname — Gemini 라우팅', () => {
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

  it('JANSAE_LLM_PRIMARY_MODEL=gemini-* + GEMINI_API_KEY 설정 → Gemini 호출', async () => {
    const fakeGeminiFetch = (await import('vitest')).vi.fn(async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(validBody) }] } }],
          usageMetadata: { promptTokenCount: 500, candidatesTokenCount: 200 },
        }),
        { status: 200 },
      ),
    );
    const r = await analyzeNickname(
      '엄마',
      {
        GEMINI_API_KEY: 'fake_gemini',
        JANSAE_LLM_PRIMARY_MODEL: 'gemini-flash-lite-latest',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { geminiFetch: fakeGeminiFetch as any },
    );
    expect(r.model).toBe('gemini-flash-lite-latest');
    expect(r.inputTokens).toBe(500);
    expect(r.outputTokens).toBe(200);
    // ($0.10*500 + $0.40*200) / 1M = (50 + 80) / 1M = 0.00013
    expect(r.costUsd).toBeCloseTo(0.00013, 8);
  });

  it('Gemini 모델 + GEMINI_API_KEY 미설정 → mock fallback', async () => {
    const r = await analyzeNickname('엄마', {
      JANSAE_LLM_PRIMARY_MODEL: 'gemini-flash-lite-latest',
    });
    expect(r.model).toBe('mock');
    expect(r.analysis.category).toBe('A'); // mockAnalyze('엄마') = A
  });

  it('Gemini 호출 실패 + fallback=mock → 자동 mock', async () => {
    const fakeGeminiFetch = (await import('vitest')).vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: 'quota exceeded' } }), {
        status: 429,
      }),
    );
    const r = await analyzeNickname(
      '엄마',
      {
        GEMINI_API_KEY: 'fake_gemini',
        JANSAE_LLM_PRIMARY_MODEL: 'gemini-flash-lite-latest',
        JANSAE_LLM_FALLBACK_MODEL: 'mock',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { geminiFetch: fakeGeminiFetch as any },
    );
    expect(r.model).toBe('mock');
  });

  it('Gemini 호출 실패 + fallback 미설정 → LLMError', async () => {
    const fakeGeminiFetch = (await import('vitest')).vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: 'auth failed' } }), {
        status: 401,
      }),
    );
    await expect(
      analyzeNickname(
        '엄마',
        {
          GEMINI_API_KEY: 'fake_gemini',
          JANSAE_LLM_PRIMARY_MODEL: 'gemini-flash-lite-latest',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { geminiFetch: fakeGeminiFetch as any },
      ),
    ).rejects.toThrow(LLMError);
  });

  it('JANSAE_LLM_PRIMARY_MODEL 미설정 → Anthropic default (mock fallback)', async () => {
    const r = await analyzeNickname('엄마', {});
    expect(r.model).toBe('mock');
  });
});
