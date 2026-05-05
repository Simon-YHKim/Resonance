/**
 * callLLMWithWiki — 모든 LLM 호출의 단일 진입점.
 *
 * - user_wiki 자동 주입
 * - llm_usage_log 자동 기록
 * - Mock fallback (옵션 1-C)
 * - 모델 라우팅 (Phase 1: Haiku 만, Phase 3: Sonnet/Flash-Lite 추가)
 *
 * 보스전·길거리 몹·NPC 대화·매크로 모두 이 함수 거침.
 *
 * Refs: 잔향_시스템명세_v1.4.md §2.3
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  getUserWikiContext,
  buildSystemPromptWithWiki,
  UserWikiContext,
} from '../middleware/wiki-injection';
import { logLLMUsage, LLMContext } from './usage-logger';

export class WikiNotFoundError extends Error {
  readonly code = 'NO_WIKI';
  constructor() {
    super('user_wiki 가 없습니다. /api/character/analyze 먼저 호출하세요.');
    this.name = 'WikiNotFoundError';
  }
}

export interface CallLLMOptions {
  /** Phase 3 라우팅용. Phase 1 은 'haiku-4.5' 만 사용. */
  model?: 'haiku-4.5' | 'sonnet-4.6' | 'flash-lite' | 'mock';
  context: LLMContext;
  isPremium?: boolean;
  maxTokens?: number;
  /** Anthropic SDK 인스턴스 주입 (테스트 friendly) */
  anthropic?: Anthropic;
  /** 미리 로드한 wiki (E2E 테스트 시 D1 호출 1회 절약) */
  wiki?: UserWikiContext;
}

export interface CallLLMResult {
  response: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// 모델 가격 (per 1M tokens, USD) — 2026.05 시안
const MODEL_PRICING = {
  'claude-haiku-4-5': { in: 1.0, out: 5.0 },
  'claude-sonnet-4-6': { in: 3.0, out: 15.0 },
} as const;

function getModelString(short?: CallLLMOptions['model']): string {
  switch (short) {
    case 'sonnet-4.6':
      return 'claude-sonnet-4-6';
    case 'flash-lite':
      return 'gemini-flash-lite'; // Phase 3
    case 'mock':
      return 'mock';
    case 'haiku-4.5':
    default:
      return 'claude-haiku-4-5';
  }
}

function calcCost(model: string, input: number, output: number): number {
  const p = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
  if (!p) return 0;
  return (input * p.in + output * p.out) / 1_000_000;
}

/**
 * Mock 응답 생성 — wiki 정보 반영한 placeholder.
 */
function mockResponse(wiki: UserWikiContext, userMessage: string): string {
  const { analysis } = wiki;
  return `(mock 응답) ${analysis.the_Voice_호칭}, "${userMessage}" 에 대한 응답입니다. ` +
    `[직업: ${analysis.추정직업} / 정서: ${analysis.정서적결}]`;
}

export async function callLLMWithWiki(
  env: { DB: D1Database; ANTHROPIC_API_KEY?: string; JANSAE_LLM_PRIMARY_MODEL?: string; JANSAE_LLM_FALLBACK_MODEL?: string },
  userId: string,
  userMessage: string,
  basePrompt: string,
  options: CallLLMOptions,
): Promise<CallLLMResult> {
  // 1. wiki 로드
  const wiki = options.wiki ?? (await getUserWikiContext(env.DB, userId));
  if (!wiki) throw new WikiNotFoundError();

  // 2. 시스템 프롬프트 빌드
  const systemPrompt = buildSystemPromptWithWiki(wiki, basePrompt);

  // 3. 모델 결정
  const useMock =
    options.model === 'mock' ||
    !env.ANTHROPIC_API_KEY ||
    env.JANSAE_LLM_PRIMARY_MODEL === 'mock';

  if (useMock) {
    const text = mockResponse(wiki, userMessage);
    await logLLMUsage(env.DB, {
      userId,
      llmModel: 'mock',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      context: options.context,
      isPremium: options.isPremium ?? false,
    });
    return { response: text, model: 'mock', inputTokens: 0, outputTokens: 0, costUsd: 0 };
  }

  // 4. 실 LLM 호출
  const client = options.anthropic ?? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = getModelString(options.model ?? 'haiku-4.5');

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens ?? 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content.find((c) => c.type === 'text');
  const text = block && block.type === 'text' ? block.text : '';

  const costUsd = calcCost(model, response.usage.input_tokens, response.usage.output_tokens);

  await logLLMUsage(env.DB, {
    userId,
    llmModel: model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    costUsd,
    context: options.context,
    isPremium: options.isPremium ?? false,
  });

  return {
    response: text,
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    costUsd,
  };
}
