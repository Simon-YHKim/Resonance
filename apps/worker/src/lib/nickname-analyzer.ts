/**
 * 닉네임 분석 — primary 모델 라우팅 (Anthropic Haiku 4.5 / Gemini Flash-Lite) + Mock fallback.
 *
 * 옵션 1-C: D1 로컬 + Mock LLM 으로 빌드, 사용자 키 발급 후 1회 검증.
 * 옵션 3-B: Haiku + Gemini 듀얼 (env.JANSAE_LLM_PRIMARY_MODEL 로 선택)
 *
 * paid-api-guard:
 *   - API 키는 env.ANTHROPIC_API_KEY / env.GEMINI_API_KEY (.dev.vars / wrangler secret put)
 *   - 미설정 시 자동 Mock fallback (로컬 개발 친화)
 *   - LLM 응답 JSON 파싱 + Zod 검증 (악성 응답 차단)
 *
 * Refs: 잔향_시스템명세_v1.4.md §2.1.1, §2.1.2
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  NicknameAnalysis,
  NicknameAnalysisSchema,
  NicknameCategory,
} from '@resonance/shared';
import { analyzeWithGemini } from './gemini-analyzer';

// ─────────────────────────────────────────────────────────────────────────────
// 시스템 프롬프트 (시스템 명세 v1.4 §2.1.1 그대로)
// ─────────────────────────────────────────────────────────────────────────────

export const NICKNAME_ANALYZER_SYSTEM_PROMPT = `당신은 게임 *잔향(Resonance)*의 닉네임 분석가입니다.
사용자가 입력한 닉네임에서 다음을 추론해주세요:

1. 직업·신분 (직장인/대학생/대학원생/주부/은퇴자/프리랜서/학생/기타)
2. 추정 연령대 (10대/20대/30대/40대/50대+)
3. 추정 환경 (사무실/캠퍼스/연구실/집·동네/공방/기타)
4. 정서적 결 (지친/평이한/희망적/슬픈/장난스러운/외로운/그리운)
5. 닉네임 카테고리 (A: 가족 호칭 / B: 보편 한국 이름 / C: 실명 변형 /
   D: 위험 단어 / E: 욕설 / F: 정치인·종교 / G: 타 IP / H: 안전 다양)

추가:
6. 주요 키워드 (5개) — 닉네임에서 직접 추출
7. 스토리 매칭 — 5체 보스의 자리를 추정 신분에 맞게 매칭

반드시 JSON 형식으로만 응답:
{
  "nickname": "...",
  "category": "...",
  "추정직업": "...",
  "추정연령": "...",
  "추정환경": "...",
  "정서적결": "...",
  "주요키워드": [...],
  "스토리매칭": {
    "보스1자리": "...",
    "보스1회상": "...",
    "보스2자리": "...",
    "보스3자리": "...",
    "보스4자리": "초등학교 골목 — 사용자 추정 출신 지역",
    "보스5자리": "회색 운동장 (공통)"
  },
  "거점NPC말투": {
    "차분한가게주인": "..."
  },
  "the_Voice_호칭": "..."
}

다른 텍스트·설명·markdown 금지. JSON 만.`;

// ─────────────────────────────────────────────────────────────────────────────
// 입력 검증
// ─────────────────────────────────────────────────────────────────────────────

export class InvalidNicknameError extends Error {
  readonly code = 'INVALID_NICKNAME';
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNicknameError';
  }
}

export class LLMError extends Error {
  readonly code = 'LLM_ERROR';
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'LLMError';
  }
}

/** 닉네임 1차 검증 — 길이·문자 종류. 카테고리 분류는 LLM. */
export function validateNickname(nickname: unknown): string {
  if (typeof nickname !== 'string') {
    throw new InvalidNicknameError('닉네임은 문자열이어야 합니다.');
  }
  const trimmed = nickname.trim();
  if (trimmed.length < 1 || trimmed.length > 20) {
    throw new InvalidNicknameError('닉네임은 1~20자여야 합니다.');
  }
  // 한글·영문·숫자·일부 공백 허용. 제어문자·이모지 차단.
  if (!/^[\p{Script=Hangul}\p{Script=Latin}\p{Number} _\-]+$/u.test(trimmed)) {
    throw new InvalidNicknameError('닉네임은 한글·영문·숫자·공백·언더스코어·하이픈만 허용됩니다.');
  }
  return trimmed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock fallback — 룰 기반 분류 + 시드 매칭
// ─────────────────────────────────────────────────────────────────────────────

/** 위험 키워드 (D 카테고리) — 자살예방법 §19조의2 */
const DANGER_KEYWORDS = ['자살', '자해', '죽음', '죽고', '베', '뛰어내', '암'];
/** 가족 호칭 (A 카테고리) */
const FAMILY_KEYWORDS = ['엄마', '아빠', '누나', '오빠', '형', '동생', '할머니', '할아버지', 'mom', 'dad'];
/** 직장 키워드 — 추정직업 시드 */
const WORKER_KEYWORDS = ['대리', '과장', '부장', '사원', '회사', '출근', '회의'];
const STUDENT_KEYWORDS = ['대학', '복학', '학번', '졸업', '학부'];
const GRAD_KEYWORDS = ['박사', '석사', '논문', '연구실', '교수'];
const HOMEMAKER_KEYWORDS = ['아이', '육아', '시댁', '며느리', '결혼'];

function mockClassify(nickname: string): NicknameCategory {
  if (DANGER_KEYWORDS.some((k) => nickname.includes(k))) return 'D';
  if (FAMILY_KEYWORDS.some((k) => nickname.toLowerCase().includes(k.toLowerCase()))) return 'A';
  return 'H';
}

function mockOccupation(nickname: string): string {
  if (WORKER_KEYWORDS.some((k) => nickname.includes(k))) return '직장인';
  if (GRAD_KEYWORDS.some((k) => nickname.includes(k))) return '대학원생';
  if (STUDENT_KEYWORDS.some((k) => nickname.includes(k))) return '대학생';
  if (HOMEMAKER_KEYWORDS.some((k) => nickname.includes(k))) return '주부';
  return '기타';
}

function mockBoss1Place(occ: string): string {
  switch (occ) {
    case '직장인':
      return '강남역 출근길';
    case '대학생':
      return '신촌·홍대 또는 캠퍼스 입구';
    case '대학원생':
      return '연구실 또는 교수님 방';
    case '주부':
      return '어린이집 앞·아파트 단지';
    default:
      return '동네 거리';
  }
}

function mockBoss1Memory(occ: string): string {
  switch (occ) {
    case '직장인':
      return '회사 회식 자리 또는 사내 휴게실';
    case '대학생':
      return '동아리방 술자리 또는 MT 자리';
    case '대학원생':
      return '랩 회식 자리 또는 학회 발표';
    case '주부':
      return '가족 식탁 또는 친구 모임';
    default:
      return '오래 다닌 자리';
  }
}

function mockMood(nickname: string): string {
  if (/지친|싫|짜증|힘든/.test(nickname)) return '지친';
  if (/외로|혼자|혼술/.test(nickname)) return '외로운';
  if (/그리운|추억|옛날/.test(nickname)) return '그리운';
  return '평이한';
}

/**
 * Mock 분석 — Anthropic 키 미설정 또는 명시적 Mock 모드.
 * 실 LLM 호출 없이 룰 기반으로 NicknameAnalysis 생성.
 */
export function mockAnalyze(nickname: string): NicknameAnalysis {
  const cleaned = validateNickname(nickname);
  const category = mockClassify(cleaned);
  const occupation = mockOccupation(cleaned);

  // 키워드 — 닉네임에서 2~3자 chunk 추출 (시드 룰)
  const tokens = cleaned
    .replace(/[\s_\-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  const keywords = (tokens.length > 0 ? tokens : [cleaned]).slice(0, 5);

  return {
    nickname: cleaned,
    category,
    추정직업: occupation,
    추정연령: '30대',
    추정환경: occupation === '직장인' ? '사무실' : occupation === '대학생' ? '캠퍼스' : '집·동네',
    정서적결: mockMood(cleaned),
    주요키워드: keywords,
    스토리매칭: {
      보스1자리: mockBoss1Place(occupation),
      보스1회상: mockBoss1Memory(occupation),
      보스2자리: '한강 둔치',
      보스3자리: '종로 학원가 또는 도서관',
      보스4자리: '초등학교 골목',
      보스5자리: '회색 운동장 (공통)',
    },
    거점NPC말투: {
      차분한가게주인: `수고했어요. ${cleaned}님.`,
    },
    the_Voice_호칭: `${cleaned}님`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 실 LLM 호출 (Anthropic Haiku 4.5 + Gemini Flash-Lite 라우팅)
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyzeOptions {
  /** 'mock' 강제 — 단위 테스트용 */
  forceMock?: boolean;
  /** Anthropic SDK 인스턴스 주입 (테스트 friendly) */
  anthropic?: Anthropic;
  /** Gemini fetch 주입 (테스트 friendly) */
  geminiFetch?: typeof fetch;
}

export interface AnalyzeResult {
  analysis: NicknameAnalysis;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Haiku 4.5 가격 (per 1M tokens, USD) — 2026.05 기준 시안. 변동 시 갱신.
const HAIKU_INPUT_USD_PER_M = 1.0;
const HAIKU_OUTPUT_USD_PER_M = 5.0;

function calcHaikuCost(input: number, output: number): number {
  return (input * HAIKU_INPUT_USD_PER_M + output * HAIKU_OUTPUT_USD_PER_M) / 1_000_000;
}

/** 모델명에서 provider 추론 (라우팅 시그널) */
function detectProvider(modelName?: string): 'anthropic' | 'gemini' | 'mock' {
  if (!modelName || modelName === 'mock') return 'mock';
  if (modelName.startsWith('gemini-')) return 'gemini';
  if (modelName.startsWith('claude-')) return 'anthropic';
  return 'anthropic'; // default
}

/**
 * 닉네임 분석 — primary 모델 라우팅, fallback mock.
 *
 * 모델 라우팅 (env.JANSAE_LLM_PRIMARY_MODEL 값에 따라):
 *   - 'mock'              → mockAnalyze
 *   - 'gemini-*'          → Gemini Flash-Lite (REST)
 *   - 'claude-*' (default) → Anthropic Haiku 4.5
 *
 * 키 미설정 시 자동 mock fallback (옵션 1-C — 로컬 friendly).
 *
 * @param nickname  사용자 입력
 * @param env       Cloudflare bindings (ANTHROPIC_API_KEY / GEMINI_API_KEY 등)
 * @param options   테스트 friendly 주입
 */
export async function analyzeNickname(
  nickname: unknown,
  env: {
    ANTHROPIC_API_KEY?: string;
    GEMINI_API_KEY?: string;
    JANSAE_LLM_PRIMARY_MODEL?: string;
    JANSAE_LLM_FALLBACK_MODEL?: string;
  },
  options: AnalyzeOptions = {},
): Promise<AnalyzeResult> {
  const cleaned = validateNickname(nickname);
  const provider = detectProvider(env.JANSAE_LLM_PRIMARY_MODEL);

  // Mock 분기 우선
  const apiKeyMissing =
    (provider === 'anthropic' && !env.ANTHROPIC_API_KEY) ||
    (provider === 'gemini' && !env.GEMINI_API_KEY);

  const useMock = options.forceMock === true || provider === 'mock' || apiKeyMissing;

  if (useMock) {
    return {
      analysis: mockAnalyze(cleaned),
      model: 'mock',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
    };
  }

  // Gemini 라우팅
  if (provider === 'gemini') {
    try {
      const r = await analyzeWithGemini(
        cleaned,
        NICKNAME_ANALYZER_SYSTEM_PROMPT,
        env.GEMINI_API_KEY!,
        {
          model: env.JANSAE_LLM_PRIMARY_MODEL,
          fetch: options.geminiFetch,
        },
      );
      return r;
    } catch (err) {
      if (env.JANSAE_LLM_FALLBACK_MODEL === 'mock') {
        return {
          analysis: mockAnalyze(cleaned),
          model: 'mock',
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
        };
      }
      if (err instanceof LLMError) throw err;
      throw new LLMError('Gemini 호출 실패. 잠시 후 다시 시도해주세요.', err);
    }
  }

  // Anthropic 라우팅 (default)
  const client = options.anthropic ?? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = env.JANSAE_LLM_PRIMARY_MODEL || 'claude-haiku-4-5';

  let response;
  try {
    response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: NICKNAME_ANALYZER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `닉네임: "${cleaned}"` }],
    });
  } catch (err) {
    // fallback: mock
    if (env.JANSAE_LLM_FALLBACK_MODEL === 'mock') {
      return {
        analysis: mockAnalyze(cleaned),
        model: 'mock',
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      };
    }
    throw new LLMError('LLM 호출 실패. 잠시 후 다시 시도해주세요.', err);
  }

  // 응답 텍스트 추출
  const block = response.content.find((c) => c.type === 'text');
  if (!block || block.type !== 'text') {
    throw new LLMError('LLM 응답이 비어 있습니다.');
  }

  // JSON 파싱 + Zod 검증
  let parsed: unknown;
  try {
    // 일부 LLM이 markdown ```json 으로 감싸는 경우 대응
    const text = block.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    parsed = JSON.parse(text);
  } catch (err) {
    throw new LLMError('LLM 응답 JSON 파싱 실패.', err);
  }

  const validated = NicknameAnalysisSchema.safeParse(parsed);
  if (!validated.success) {
    throw new LLMError(`LLM 응답 스키마 위반: ${validated.error.message}`);
  }

  // 닉네임 일관성 — LLM이 응답에 다른 닉네임을 넣은 경우 강제 교정
  const analysis: NicknameAnalysis = { ...validated.data, nickname: cleaned };

  return {
    analysis,
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    costUsd: calcHaikuCost(response.usage.input_tokens, response.usage.output_tokens),
  };
}
