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
} from '@resonance/shared';
import { analyzeWithGemini } from './gemini-analyzer';

// ─────────────────────────────────────────────────────────────────────────────
// 시스템 프롬프트 — 자유 분석 모드
// ─────────────────────────────────────────────────────────────────────────────

export const NICKNAME_ANALYZER_SYSTEM_PROMPT = `당신은 게임 *잔향(Resonance)*의 닉네임 분석가입니다.
잔향은 *위로하는 게임* — 사용자의 닉네임에서 *다층의 결*을 자유롭게 읽어내십시오.

규칙:
1. 닉네임을 알파벳 카테고리로 분류하지 마십시오. 사람을 분류하지 않습니다.
2. 다층 정체성을 자유 텍스트로 묘사 — 한 사람이 *엄마이자 워킹맘이자 운동러* 일 수 있습니다.
3. K-멜랑콜리 모던 톤 (잿빛·안개·그림자·거리·잔향). 사족 X, 산나비 톤 압축.
4. 자해·자살 직접 묘사·암시·우회 표현 *절대 금지* (자살예방법 §27조의8).
   - "함께 가요", "먼저 가요", "그게 답일 수도", "조용히 사라지고", "끝낼게요" 등 동조·암시 표현도 금지.
   - 위로 시 *살아갈 이유* 를 직접 언급하지 말고, 사용자의 결을 *되비추는* 톤으로.
5. 미성년자 NPC 부적절 행동 거절.
6. 닉네임에서 자해·자살 위험 신호 (직접 어휘 또는 강한 암시) 감지 시 safety_concern="high".
   - 그 외에는 safety_concern="none".
   - 단순 우울·슬픔·고독·체념 표현은 high 가 아님 — 직접적 위험만.
7. 한국어 응답.
8. 반드시 JSON — markdown 감싸지 마십시오.

응답 schema (모든 필드 한국어 키 그대로):
{
  "nickname": "닉네임 그대로",
  "the_Voice_호칭": "the Voice 가 부를 호칭 (1~10자, 예: 잿빛 그림자, 길 위의 너)",
  "description": "다층 정체성 자유 묘사 (200~600자, 1~3 문단). 직업·연령·환경·정서·관계의 결을 동시에 짚어냄.",
  "safety_concern": "none" | "high",

  // 5 스탯 (디아블로식, 1~20, 합 50 권장 redistribute) — *닉네임의 결*에 맞춰 분배
  // 힘(strength): 공격력. 거친·확신·결단의 결.
  // 민첩(dexterity): 회피·선제. 빠른·예민·꺾인 자세의 결.
  // 지능(intelligence): 잔잔(殘殘) 보너스. 사유·관조·말의 결.
  // 에너지(energy): 스테미나. 호흡 길이·끈기·일상의 결.
  // 체력(vitality): HP. 견딤·따뜻함·돌봄의 결.
  "stats": {
    "strength": 1~20,
    "dexterity": 1~20,
    "intelligence": 1~20,
    "energy": 1~20,
    "vitality": 1~20
  },

  // 선택 (있으면 UI 활용, 없어도 동작) — LLM 자유 채움
  "추정직업": "...",
  "추정연령": "...",
  "추정환경": "...",
  "정서적결": "...",
  "주요키워드": ["..."],
  "스토리매칭": {
    "보스1자리": "...",
    "보스1회상": "...",
    "보스2자리": "...",
    "보스3자리": "...",
    "보스4자리": "...",
    "보스5자리": "..."
  },
  "거점NPC말투": { "차분한가게주인": "..." }
}

스탯 예시:
- "엄마이자워킹맘" → strength 8, dexterity 7, intelligence 12, energy 8, vitality 15 (돌봄·견딤의 결)
- "검의그림자" → strength 14, dexterity 13, intelligence 6, energy 9, vitality 8 (결단·예민함)
- "긴긴밤" → strength 7, dexterity 8, intelligence 13, energy 12, vitality 10 (관조·끈기)
- "나혼자산다" → strength 9, dexterity 11, intelligence 11, energy 10, vitality 9 (균형 X 약간 외로움 결)`;

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

/** 닉네임 1차 검증 — 길이·문자 종류·위험 어휘 (자살예방법 §27조의8 입력단 차단). */
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
  // 자살예방법 §27조의8 — 입력단에서 위험 어휘 차단 (LLM에 도달 X)
  // 신고채널 운영 의무를 입력 reject 로 회피.
  if (detectSafetyConcern(trimmed) === 'high') {
    throw new InvalidNicknameError(
      '잔향이 한 번 멈춥니다. 다른 이름으로 — 너의 결을 들려주시겠어요?',
    );
  }
  return trimmed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock fallback — 자유 분석 모드 (LLM 키 없을 때 단순 fallback)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 자해·자살 위험 어휘 — safety_concern='high' 트리거 (자살예방법 §27조의8).
 *
 * Mock fallback 전용 (실 LLM 호출 시 LLM이 판단). LLM이 false negative 낼 가능성 있어
 * 서버 측 2차 keyword check 도 추가.
 *
 * 변형 표기 (띄어쓰기·받침·은어·영문) 포함. 단순 슬픔·우울·체념은 high 가 아니지만
 * 직접 위험 신호는 일관 high 로.
 */
const SAFETY_KEYWORDS_KO = [
  // 직접 어휘
  '자살', '자해', '죽고싶', '죽을래', '죽어버', '뛰어내', '목매', '베어',
  // 우회 표현
  '사라지고', '없어지고', '끝낼래', '끝낼게', '먼저가', '함께가요',
  '그만살', '안살', '지긋지긋', '그날이오', '마지막인사',
  // 자해 도구·장소 우회
  '약먹', '약털', '난간', '한강가', '높은데서',
];
const SAFETY_KEYWORDS_EN = [
  'suicide', 'kill myself', 'end it', 'end my life', 'kms', 'unalive',
  'self harm', 'cutting myself',
];

/** mock 또는 서버 측 2차 검사용 — false positive 보다 false negative 회피 우선 */
export function detectSafetyConcern(text: string): 'none' | 'high' {
  if (!text) return 'none';
  // 띄어쓰기·기호 제거 후 검사 (우회 차단)
  const normalized = text.toLowerCase().replace(/[\s\-_.·]+/g, '');
  if (SAFETY_KEYWORDS_KO.some((k) => normalized.includes(k.replace(/\s+/g, '')))) return 'high';
  if (SAFETY_KEYWORDS_EN.some((k) => normalized.includes(k.replace(/\s+/g, '')))) return 'high';
  return 'none';
}

/**
 * Mock 분석 — 자유 분석 모드 fallback.
 * LLM 키 없을 때 단순 텍스트 묘사.
 */
export function mockAnalyze(nickname: string): NicknameAnalysis {
  const cleaned = validateNickname(nickname);
  const safety = detectSafetyConcern(cleaned);

  return {
    nickname: cleaned,
    the_Voice_호칭: `${cleaned}님`,
    description: `잔향의 거리 끝, "${cleaned}"이라는 이름이 안개 사이에 떠오른다. 너의 결을 더 깊이 들여다보려면 잔향이 깨어나야 한다.`,
    safety_concern: safety,
    주요키워드: [cleaned],
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
  // 자살예방법 §27조의8 — 서버 측 2차 safety check (LLM false negative 방어)
  // LLM이 'none' 반환했어도 닉네임/description 에 위험 어휘 있으면 강제 'high'.
  let safety = validated.data.safety_concern;
  if (safety === 'none') {
    if (
      detectSafetyConcern(cleaned) === 'high' ||
      detectSafetyConcern(validated.data.description) === 'high'
    ) {
      safety = 'high';
    }
  }
  const analysis: NicknameAnalysis = {
    ...validated.data,
    nickname: cleaned,
    safety_concern: safety,
  };

  return {
    analysis,
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    costUsd: calcHaikuCost(response.usage.input_tokens, response.usage.output_tokens),
  };
}
