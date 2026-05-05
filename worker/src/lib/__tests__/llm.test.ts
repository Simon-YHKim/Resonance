import { describe, it, expect, vi } from 'vitest';
import { callLLMWithWiki, WikiNotFoundError } from '../llm';
import { UserWikiContext } from '../../middleware/wiki-injection';

const sampleWiki: UserWikiContext = {
  userId: 'user_test',
  analysis: {
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
      보스3자리: '학원',
      보스4자리: '초등학교 골목',
      보스5자리: '회색 운동장',
    },
    거점NPC말투: { 차분한가게주인: '수고했어요. 엄마.' },
    the_Voice_호칭: '엄마',
  },
  recentMilestones: [],
  dominantAxis: null,
  axisLockedAt: null,
};

function makeMockDB(wikiRow: any | null = null) {
  const insertedLogs: any[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: any[]) {
          return {
            async first<T>() {
              if (sql.startsWith('SELECT * FROM user_wiki')) {
                return wikiRow as T | null;
              }
              return null as T | null;
            },
            async run() {
              if (sql.startsWith('INSERT INTO llm_usage_log')) {
                insertedLogs.push(args);
              }
              return { success: true } as any;
            },
          };
        },
      };
    },
  } as unknown as D1Database;
  return { db, insertedLogs };
}

describe('callLLMWithWiki — wiki not found', () => {
  it('user_wiki 없으면 WikiNotFoundError', async () => {
    const { db } = makeMockDB(null);
    await expect(
      callLLMWithWiki(
        { DB: db } as any,
        'user_test',
        'hello',
        'base',
        { context: 'battle' },
      ),
    ).rejects.toThrow(WikiNotFoundError);
  });
});

describe('callLLMWithWiki — Mock 응답 (no API key)', () => {
  it('API 키 없으면 자동 mock + log 기록', async () => {
    const { db, insertedLogs } = makeMockDB();
    const r = await callLLMWithWiki(
      { DB: db } as any,
      'user_test',
      '안녕',
      'You are the Voice.',
      { context: 'battle', wiki: sampleWiki },
    );
    expect(r.model).toBe('mock');
    expect(r.inputTokens).toBe(0);
    expect(r.outputTokens).toBe(0);
    expect(r.costUsd).toBe(0);
    expect(r.response).toContain('엄마'); // wiki 호칭 반영
    expect(insertedLogs).toHaveLength(1);
    expect(insertedLogs[0][1]).toBe('mock'); // llm_model 칸
  });

  it('options.model = mock 명시', async () => {
    const { db, insertedLogs } = makeMockDB();
    const r = await callLLMWithWiki(
      { DB: db, ANTHROPIC_API_KEY: 'sk-fake' } as any,
      'user_test',
      'hi',
      'base',
      { context: 'macro', wiki: sampleWiki, model: 'mock' },
    );
    expect(r.model).toBe('mock');
    expect(insertedLogs).toHaveLength(1);
  });

  it('JANSAE_LLM_PRIMARY_MODEL=mock 환경 → mock', async () => {
    const { db } = makeMockDB();
    const r = await callLLMWithWiki(
      { DB: db, ANTHROPIC_API_KEY: 'sk-fake', JANSAE_LLM_PRIMARY_MODEL: 'mock' } as any,
      'user_test',
      'hi',
      'base',
      { context: 'story', wiki: sampleWiki },
    );
    expect(r.model).toBe('mock');
  });
});

describe('callLLMWithWiki — Anthropic 실 호출 (mock 주입)', () => {
  it('Haiku 호출 → 토큰·비용 계산 + log 기록', async () => {
    const { db, insertedLogs } = makeMockDB();
    const fakeAnthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: '...괜찮아요. 엄마.' }],
          usage: { input_tokens: 500, output_tokens: 200 },
        }),
      },
    };
    const r = await callLLMWithWiki(
      { DB: db, ANTHROPIC_API_KEY: 'sk-fake' } as any,
      'user_test',
      '오늘 일이 많네요.',
      'You are the Voice.',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { context: 'story', wiki: sampleWiki, anthropic: fakeAnthropic as any },
    );
    expect(r.model).toBe('claude-haiku-4-5');
    expect(r.inputTokens).toBe(500);
    expect(r.outputTokens).toBe(200);
    // $1 * 500/1M + $5 * 200/1M = 0.0005 + 0.001 = 0.0015
    expect(r.costUsd).toBeCloseTo(0.0015, 5);
    expect(r.response).toContain('엄마');
    expect(insertedLogs).toHaveLength(1);

    // system prompt에 wiki 주입 확인
    const callArgs = (fakeAnthropic.messages.create as any).mock.calls[0][0];
    expect(callArgs.system).toContain('엄마'); // 닉네임
    expect(callArgs.system).toContain('주부'); // 추정직업
    expect(callArgs.system).toContain('You are the Voice.'); // base prompt
  });

  it('Sonnet 라우팅 (Phase 3 미리)', async () => {
    const { db } = makeMockDB();
    const fakeAnthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: '깊은 응답' }],
          usage: { input_tokens: 1000, output_tokens: 400 },
        }),
      },
    };
    const r = await callLLMWithWiki(
      { DB: db, ANTHROPIC_API_KEY: 'sk-fake' } as any,
      'user_test',
      '...',
      'base',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { context: 'battle', wiki: sampleWiki, model: 'sonnet-4.6', anthropic: fakeAnthropic as any },
    );
    expect(r.model).toBe('claude-sonnet-4-6');
    // $3 * 1000/1M + $15 * 400/1M = 0.003 + 0.006 = 0.009
    expect(r.costUsd).toBeCloseTo(0.009, 5);
  });

  it('빈 응답 — 빈 string + log', async () => {
    const { db, insertedLogs } = makeMockDB();
    const fakeAnthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [],
          usage: { input_tokens: 100, output_tokens: 0 },
        }),
      },
    };
    const r = await callLLMWithWiki(
      { DB: db, ANTHROPIC_API_KEY: 'sk-fake' } as any,
      'user_test',
      'hi',
      'base',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { context: 'story', wiki: sampleWiki, anthropic: fakeAnthropic as any },
    );
    expect(r.response).toBe('');
    expect(insertedLogs).toHaveLength(1);
  });
});
