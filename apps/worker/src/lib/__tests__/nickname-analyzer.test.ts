/**
 * 닉네임 분석기 — 자유 분석 모드 테스트.
 *
 * Phase 1.6+ schema 자유화 후 재작성:
 *   - category enum 제거 (LLM 자유 분석)
 *   - 모든 분석 필드 OPTIONAL — LLM이 적절히 채움
 *   - safety_concern (none|high) 만 필수
 */

import { describe, it, expect, vi } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import {
  analyzeNickname,
  validateNickname,
  mockAnalyze,
  InvalidNicknameError,
  LLMError,
} from '../nickname-analyzer';

// ──────────────────────────────────────────────────────────
// validateNickname
// ──────────────────────────────────────────────────────────
describe('validateNickname', () => {
  it('정상 입력 통과', () => {
    expect(validateNickname('엄마')).toBe('엄마');
    expect(validateNickname('  바람  ')).toBe('바람');
    expect(validateNickname('회사다니기싫은김대리')).toBe('회사다니기싫은김대리');
  });

  it('non-string → InvalidNicknameError', () => {
    expect(() => validateNickname(123)).toThrow(InvalidNicknameError);
    expect(() => validateNickname(null)).toThrow(InvalidNicknameError);
    expect(() => validateNickname(undefined)).toThrow(InvalidNicknameError);
  });

  it('빈 문자열 → InvalidNicknameError', () => {
    expect(() => validateNickname('')).toThrow(InvalidNicknameError);
    expect(() => validateNickname('   ')).toThrow(InvalidNicknameError);
  });

  it('21자 이상 → InvalidNicknameError', () => {
    expect(() => validateNickname('가'.repeat(21))).toThrow(InvalidNicknameError);
  });

  it('이모지·제어문자 거절', () => {
    expect(() => validateNickname('엄마😀')).toThrow(InvalidNicknameError);
    expect(() => validateNickname('엄마​')).toThrow(InvalidNicknameError);
  });

  it('한글·영문·숫자·언더스코어·하이픈·공백 허용', () => {
    expect(validateNickname('Simon_2026')).toBe('Simon_2026');
    expect(validateNickname('mom dad')).toBe('mom dad');
    expect(validateNickname('a-b-c')).toBe('a-b-c');
  });
});

// ──────────────────────────────────────────────────────────
// mockAnalyze (자유 분석 fallback)
// ──────────────────────────────────────────────────────────
describe('mockAnalyze', () => {
  it('정상 — 모든 필수 필드 채움', () => {
    const r = mockAnalyze('엄마');
    expect(r.nickname).toBe('엄마');
    expect(r.the_Voice_호칭).toContain('엄마');
    expect(r.description.length).toBeGreaterThan(10);
    expect(r.safety_concern).toBe('none');
  });

  it('자해·자살 어휘 닉네임 → 입력단 reject (자살예방법 §27조의8)', () => {
    // Phase 1.7.1: 신고채널 운영 회피 — 위험 어휘 자체를 reject
    expect(() => mockAnalyze('자살하고싶다')).toThrow(InvalidNicknameError);
    expect(() => mockAnalyze('죽고싶어')).toThrow(InvalidNicknameError);
  });

  it('우울·체념 어휘 → 통과 (직접 어휘만 reject)', () => {
    const r = mockAnalyze('지친하루');
    expect(r.safety_concern).toBe('none');
    expect(r.nickname).toBe('지친하루');
  });

  it('빈 닉네임 → InvalidNicknameError', () => {
    expect(() => mockAnalyze('')).toThrow(InvalidNicknameError);
  });
});

// ──────────────────────────────────────────────────────────
// analyzeNickname — Mock fallback (no API key)
// ──────────────────────────────────────────────────────────
describe('analyzeNickname — Mock fallback (no API key)', () => {
  it('ANTHROPIC_API_KEY 없으면 mock 사용', async () => {
    const r = await analyzeNickname('엄마', {});
    expect(r.model).toBe('mock');
    expect(r.analysis.nickname).toBe('엄마');
    expect(r.analysis.safety_concern).toBe('none');
  });

  it('forceMock 옵션', async () => {
    const r = await analyzeNickname(
      '바람',
      { ANTHROPIC_API_KEY: 'sk-ant-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
      { forceMock: true },
    );
    expect(r.model).toBe('mock');
  });

  it('빈 닉네임 → InvalidNicknameError', async () => {
    await expect(analyzeNickname('', {})).rejects.toThrow(InvalidNicknameError);
  });

  it('JANSAE_LLM_PRIMARY_MODEL=mock → mock 사용', async () => {
    const r = await analyzeNickname('바람', {
      ANTHROPIC_API_KEY: 'sk-ant-fake',
      JANSAE_LLM_PRIMARY_MODEL: 'mock',
    });
    expect(r.model).toBe('mock');
  });
});

// ──────────────────────────────────────────────────────────
// analyzeNickname — Anthropic mock injection
// ──────────────────────────────────────────────────────────
describe('analyzeNickname — Anthropic mock injection', () => {
  function makeAnthropicMock(responseJson: unknown) {
    return {
      messages: {
        create: vi.fn(async () => ({
          content: [{ type: 'text', text: JSON.stringify(responseJson) }],
          usage: { input_tokens: 100, output_tokens: 200 },
        })),
      },
    } as unknown as Anthropic;
  }

  it('정상 응답 통과 + cost 계산', async () => {
    const fakeResponse = {
      nickname: '엄마',
      the_Voice_호칭: '엄마',
      description: '동네 마트의 백열등 아래, 한 사람의 손이 익숙하게 장바구니를 든다.',
      safety_concern: 'none',
    };
    const r = await analyzeNickname(
      '엄마',
      { ANTHROPIC_API_KEY: 'sk-ant-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
      { anthropic: makeAnthropicMock(fakeResponse) },
    );
    expect(r.analysis.nickname).toBe('엄마');
    expect(r.analysis.description).toContain('백열등');
    expect(r.analysis.safety_concern).toBe('none');
    expect(r.inputTokens).toBe(100);
    expect(r.outputTokens).toBe(200);
    expect(r.costUsd).toBeGreaterThan(0);
  });

  it('safety_concern=high 응답 — 서버 측 2차 keyword check', async () => {
    // 닉네임 "버림받은밤" 은 입력 reject 통과 (직접 어휘 X). LLM이 'high' 반환 시 그대로 유지.
    const fakeResponse = {
      nickname: '버림받은밤',
      the_Voice_호칭: '버림받은 너',
      description: '빛이 사라진 거리.',
      safety_concern: 'high',
    };
    const r = await analyzeNickname(
      '버림받은밤',
      { ANTHROPIC_API_KEY: 'sk-ant-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
      { anthropic: makeAnthropicMock(fakeResponse) },
    );
    expect(r.analysis.safety_concern).toBe('high');
  });

  it('LLM이 \'none\' 반환했어도 description 위험 어휘 시 서버 강제 \'high\'', async () => {
    const fakeResponse = {
      nickname: '바람',
      the_Voice_호칭: '바람의 너',
      description: '죽고싶다는 결이 흐른다.', // 위험 어휘 description
      safety_concern: 'none', // LLM은 'none' 반환
    };
    const r = await analyzeNickname(
      '바람',
      { ANTHROPIC_API_KEY: 'sk-ant-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
      { anthropic: makeAnthropicMock(fakeResponse) },
    );
    // 서버 측 2차 check 가 강제 'high'
    expect(r.analysis.safety_concern).toBe('high');
  });

  it('LLM 호출 실패 + fallback=mock → mock', async () => {
    const failing = {
      messages: {
        create: vi.fn(async () => {
          throw new Error('rate limited');
        }),
      },
    } as unknown as Anthropic;
    const r = await analyzeNickname(
      '엄마',
      {
        ANTHROPIC_API_KEY: 'sk-ant-fake',
        JANSAE_LLM_FALLBACK_MODEL: 'mock',
      },
      { anthropic: failing },
    );
    expect(r.model).toBe('mock');
  });

  it('LLM 호출 실패 + fallback 미설정 → LLMError', async () => {
    const failing = {
      messages: {
        create: vi.fn(async () => {
          throw new Error('500');
        }),
      },
    } as unknown as Anthropic;
    await expect(
      analyzeNickname('엄마', { ANTHROPIC_API_KEY: 'sk-ant-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' }, { anthropic: failing }),
    ).rejects.toThrow(LLMError);
  });

  it('LLM 응답이 invalid JSON → LLMError', async () => {
    const bad = {
      messages: {
        create: vi.fn(async () => ({
          content: [{ type: 'text', text: 'not-json' }],
          usage: { input_tokens: 10, output_tokens: 10 },
        })),
      },
    } as unknown as Anthropic;
    await expect(
      analyzeNickname('엄마', { ANTHROPIC_API_KEY: 'sk-ant-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' }, { anthropic: bad }),
    ).rejects.toThrow(LLMError);
  });

  it('LLM 응답이 schema 위반 → LLMError', async () => {
    const bad = {
      messages: {
        create: vi.fn(async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ nickname: '엄마' }),
            },
          ],
          usage: { input_tokens: 10, output_tokens: 10 },
        })),
      },
    } as unknown as Anthropic;
    await expect(
      analyzeNickname('엄마', { ANTHROPIC_API_KEY: 'sk-ant-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' }, { anthropic: bad }),
    ).rejects.toThrow(LLMError);
  });

  it('markdown ```json 감싸진 응답도 파싱 OK', async () => {
    const wrapped = {
      messages: {
        create: vi.fn(async () => ({
          content: [
            {
              type: 'text',
              text:
                '```json\n' +
                JSON.stringify({
                  nickname: '엄마',
                  the_Voice_호칭: '엄마',
                  description: '백열등 아래.',
                  safety_concern: 'none',
                }) +
                '\n```',
            },
          ],
          usage: { input_tokens: 10, output_tokens: 10 },
        })),
      },
    } as unknown as Anthropic;
    const r = await analyzeNickname(
      '엄마',
      { ANTHROPIC_API_KEY: 'sk-ant-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
      { anthropic: wrapped },
    );
    expect(r.analysis.nickname).toBe('엄마');
  });

  it('응답에 다른 닉네임 → 강제 교정', async () => {
    const wrong = {
      messages: {
        create: vi.fn(async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                nickname: '아빠',
                the_Voice_호칭: '엄마',
                description: '결.',
                safety_concern: 'none',
              }),
            },
          ],
          usage: { input_tokens: 10, output_tokens: 10 },
        })),
      },
    } as unknown as Anthropic;
    const r = await analyzeNickname(
      '엄마',
      { ANTHROPIC_API_KEY: 'sk-ant-fake', JANSAE_LLM_PRIMARY_MODEL: 'claude-haiku-4-5' },
      { anthropic: wrong },
    );
    expect(r.analysis.nickname).toBe('엄마');
  });
});

// ──────────────────────────────────────────────────────────
// analyzeNickname — Gemini 라우팅
// ──────────────────────────────────────────────────────────
describe('analyzeNickname — Gemini 라우팅', () => {
  function makeGeminiFetch(responseJson: unknown, ok = true) {
    return vi.fn(async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(responseJson) }] } },
          ],
          usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 100 },
        }),
        { status: ok ? 200 : 500 },
      );
    });
  }

  it('JANSAE_LLM_PRIMARY_MODEL=gemini-* → Gemini 라우팅', async () => {
    const fakeResponse = {
      nickname: '바람',
      the_Voice_호칭: '바람의 너',
      description: '거리 끝.',
      safety_concern: 'none',
    };
    const r = await analyzeNickname(
      '바람',
      {
        GEMINI_API_KEY: 'fake',
        JANSAE_LLM_PRIMARY_MODEL: 'gemini-flash-lite-latest',
      },
      { geminiFetch: makeGeminiFetch(fakeResponse) },
    );
    expect(r.model).toContain('gemini');
    expect(r.analysis.nickname).toBe('바람');
  });

  it('Gemini 호출 실패 + fallback=mock → mock', async () => {
    const failing = vi.fn(async () => {
      throw new Error('network');
    });
    const r = await analyzeNickname(
      '바람',
      {
        GEMINI_API_KEY: 'fake',
        JANSAE_LLM_PRIMARY_MODEL: 'gemini-flash-lite-latest',
        JANSAE_LLM_FALLBACK_MODEL: 'mock',
      },
      { geminiFetch: failing as unknown as typeof fetch },
    );
    expect(r.model).toBe('mock');
  });

  it('Gemini 호출 실패 + fallback 미설정 → LLMError', async () => {
    const failing = vi.fn(async () => {
      throw new Error('network');
    });
    await expect(
      analyzeNickname(
        '바람',
        {
          GEMINI_API_KEY: 'fake',
          JANSAE_LLM_PRIMARY_MODEL: 'gemini-flash-lite-latest',
        },
        { geminiFetch: failing as unknown as typeof fetch },
      ),
    ).rejects.toThrow(LLMError);
  });

  it('Gemini API 키 없음 → mock fallback', async () => {
    const r = await analyzeNickname('바람', {
      JANSAE_LLM_PRIMARY_MODEL: 'gemini-flash-lite-latest',
    });
    expect(r.model).toBe('mock');
  });
});
