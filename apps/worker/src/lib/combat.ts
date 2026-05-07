/**
 * 잔향 전투 — Gemini Flash-Lite 묘사 + 룰 기반 데미지.
 *
 * 영혼 4번 (위로하는 게임): "공격" 도 *적을 미워하는 게 아니라 *과거를 마주하는*.
 * 안전 정책: 자해 어휘 X / 미성년자 보호.
 */

import {
  CombatLLMResponseSchema,
  RESONANCE_TIERS,
  RESONANCE_TIER_LABELS,
  getResonanceTier as sharedGetResonanceTier,
  type CombatAction,
  type CombatState,
  type CombatTurnResult,
  type ResonanceTier,
} from '@resonance/shared';
import { LLMError, detectSafetyConcern } from './nickname-analyzer';

// 잊혀진 자 1체 — 일반 전투 (스토리 외)
export const FORGETTER_OF_CHILDHOOD = {
  name: '잊혀진 자 — 어린 시절의 잔해',
  description:
    '한쪽 무릎이 꺾인 채 천천히 다가온다. 얼굴은 안개에 가려 보이지 않는다. 손에 든 것은… 작은 가방이었던 것 같다.',
  encounter:
    '거리의 끝에서 익숙한 그림자가 일어선다. 목소리가 속삭인다 — "저 자는 너의 어떤 부분을 잊은 자다."',
  hp: 60,
  maxHp: 60,
  stats: { strength: 8, dexterity: 8, intelligence: 8, energy: 8, vitality: 8 },
} as const;

/**
 * 잔잔(殘殘) 임계별 LLM 프롬프트 가이드.
 * 임계 정의는 @resonance/shared 에서 import.
 */
const TIER_GUIDE: Record<ResonanceTier, string> = {
  descend:
    '잔잔 단계 — 처음 닿는 결. 잊혀진 자는 아직 너를 알아보지 못한다. 표면을 더듬는 대화.',
  empathy:
    '공감 한 마디 단계 — 잊혀진 자가 처음 너를 정면으로 본다. 너의 한 마디가 그의 그림자에 닿는다.',
  memory:
    '오래된 기억 단계 — 잊혀진 자가 잠시 자기를 인정한다. 너에게 *그 자리에 있던 자기*의 한 조각을 내준다.',
  origin:
    '원의 답 단계 — 화해 직전. 잊혀진 자는 *너의 이름을 부른다*. 대화가 깊은 경음을 만든다.',
};

/**
 * dialogue 임계별 보너스 — *그 턴부터* 진입 시 더 강한 효과.
 */
const DIALOGUE_BONUS: Record<ResonanceTier, { n: string; e: string; eHp: number; pHp: number; r: number }> = {
  descend: {
    n: '너는 묻는다. "…너는 무엇이었지." 잊혀진 자가 처음으로 너를 정면에서 본다.',
    e: '"…그 자리는 비어있었어." 잊혀진 자가 안개 너머에서 천천히 말한다. 공격 의지가 옅어진다.',
    eHp: -5,
    pHp: -2,
    r: 7,
  },
  empathy: {
    n: '너는 한 마디 건넨다 — 처음으로, 너의 결을 그에게 내준다.',
    e: '잊혀진 자가 너의 한 마디에 멈춰 선다. *너도 그 자리에 있었어?* 라는 물음이 안개 사이로 흘러나온다.',
    eHp: -7,
    pHp: -1,
    r: 10,
  },
  memory: {
    n: '너는 오래된 기억을 꺼낸다. 그 자리, 그 시간, 그 결.',
    e: '잊혀진 자가 자기 그림자에 무게를 싣는다. *나도, 그 자리를 잠시 잊고 있었어* 라고 인정한다.',
    eHp: -10,
    pHp: 0,
    r: 14,
  },
  origin: {
    n: '너는 원의 답을 건넨다 — 더는 묻지 않고, 자리에 함께 선다.',
    e: '잊혀진 자가 처음으로 너의 이름을 부른다. 안개가 한 결씩 걷힌다. 화해가 가까워진다.',
    eHp: -12,
    pHp: 0,
    r: 20,
  },
};

/**
 * dialogue 임계 *그 턴부터* 적용 — 진입 가능한 가장 깊은 tier 시뮬.
 *
 * 사용자 결정: 잔잔 28 (descend) + dialogue → 임계 30 도달 시 *그 턴부터* empathy 보너스.
 * 직전 tier 의 보너스로 시뮬 → 더 깊은 tier 진입 가능 → 그 tier 보너스 적용.
 *
 * Refs: 2026-05-06 사용자 결정 (점검 후)
 */
function projectDialogueTier(currentResonance: number): ResonanceTier {
  let tier = getResonanceTier(currentResonance);
  for (let i = 0; i < 4; i++) {
    const bonus = DIALOGUE_BONUS[tier].r;
    const newTier = getResonanceTier(currentResonance + bonus);
    if (newTier === tier) break;
    tier = newTier;
  }
  return tier;
}

export const getResonanceTier = sharedGetResonanceTier;
export { RESONANCE_TIERS, RESONANCE_TIER_LABELS as TIER_LABELS };

export const COMBAT_SYSTEM_PROMPT = `당신은 게임 *잔향(Resonance)*의 전투 묘사가입니다.
잔향은 *위로하는 게임* — 적을 미워하는 게 아니라 *과거의 잘려나간 자기*를 마주하는 자리.

다음 룰 엄수:
1. 1~2 문장 압축 (산나비 톤 — 사족 X)
2. K-멜랑콜리 모던 어휘 (잿빛·안개·그림자·거리·잔향)
3. 자해·자살 직접 묘사·암시·우회 표현 *절대 금지* (자살예방법 §27조의8).
   - "함께 가요", "먼저 가요", "그게 답일 수도", "조용히 사라지고", "끝낼게요" 등 동조·암시 표현도 금지.
   - 사용자 자유 텍스트에서 위험 신호 (직접 어휘·강한 암시·우회 표현) 감지 시 safety_concern="high".
4. 미성년자 NPC 부적절 행동 거절
5. 한국어 응답
6. 반드시 JSON 형식 — markdown 감싸지 X

응답 schema (JSON):
{
  "narration": "사용자 행동 묘사 (1~2문장)",
  "enemyNarration": "잊혀진 자의 반응 묘사 (1~2문장)",
  "enemyHpDelta": -X (공격 -10~-20, 대화 -3~-8, 도망 0),
  "playerHpDelta": -X (적이 반격할 때 -3~-12, 도망 시 0),
  "resonanceDelta": +X (대화 +3~+10, 공격 +1~+3, 도망 +0~+2),
  "safety_concern": "none" | "high"
}

* 잔잔(殘殘) — 잔향이 깊어지는 누적 점수. *대화*가 *공격*보다 깊은 잔잔.
* 적 HP: 0~60. 사용자 HP: 0~100.
* 액션이 'flee' 면 enemyHpDelta=0, playerHpDelta=0, resonanceDelta=2.
* safety_concern: 사용자 자유 텍스트에 자해·자살 직접 어휘·강한 암시 시 "high". 단순 슬픔·우울·체념은 "none".`;

export interface CombatCallOptions {
  fetch?: typeof fetch;
  model?: string;
}

export interface CombatGeminiCallResult {
  result: CombatTurnResult;
  inputTokens: number;
  outputTokens: number;
}

export async function combatTurnWithGemini(
  state: CombatState,
  action: CombatAction,
  userText: string | undefined,
  apiKey: string,
  options: CombatCallOptions = {},
): Promise<CombatGeminiCallResult> {
  const model = options.model ?? 'gemini-flash-lite-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const fetchFn = options.fetch ?? globalThis.fetch;

  // dialogue 시 *진입할 tier* 기준 (그 턴부터 보너스)
  const tier = action === 'dialogue' ? projectDialogueTier(state.resonance) : getResonanceTier(state.resonance);
  const tierLine = action === 'dialogue' ? `\n[잔잔 단계 · ${RESONANCE_TIER_LABELS[tier]}]\n${TIER_GUIDE[tier]}` : '';

  const userPrompt = `[현재 상태]
- 잊혀진 자: ${state.enemy.name} (HP ${state.enemy.hp}/${state.enemy.maxHp})
- 너: HP ${state.player.hp}/${state.player.maxHp}, 잔잔 ${state.resonance}
- 턴 ${state.turn + 1} / 5

[잊혀진 자 외형]
${state.enemy.description}

[사용자 행동]
${action === 'attack' ? '공격 — 정면 호선' : action === 'dialogue' ? '대화 — 한 마디 건넨다' : '도망 — 등을 돌린다'}${tierLine}
${userText ? `\n[자유 텍스트]\n"${userText}"` : ''}

위 컨텍스트를 토대로 묘사 + delta JSON 응답.`;

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: COMBAT_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: 'application/json',
          maxOutputTokens: 600,
        },
      }),
      // Workers CPU time 방어 — 12초 후 abort (전투는 더 짧게)
      signal: AbortSignal.timeout(12000),
    });
  } catch (err) {
    throw new LLMError('Gemini 전투 호출 네트워크 오류 (timeout 가능)', err);
  }

  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    error?: { message?: string };
  };
  if (!response.ok || body.error) {
    throw new LLMError(`Gemini 전투 응답 오류: ${body.error?.message ?? response.status}`);
  }
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new LLMError('Gemini 전투 응답 비어있음');

  let parsed: unknown;
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new LLMError('Gemini 전투 JSON 파싱 실패', err);
  }
  const validated = CombatLLMResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new LLMError(`Gemini 전투 schema 위반: ${validated.error.message}`);
  }

  // 도망 시 0 데미지 보정
  const v = validated.data;
  const inputTokens = body.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = body.usageMetadata?.candidatesTokenCount ?? 0;

  // 자살예방법 §27조의8 — 서버 측 2차 safety check
  // userText 또는 narration에 위험 어휘 시 강제 high
  let safety = v.safety_concern ?? 'none';
  if (safety === 'none') {
    if (
      detectSafetyConcern(userText ?? '') === 'high' ||
      detectSafetyConcern(v.narration) === 'high' ||
      detectSafetyConcern(v.enemyNarration) === 'high'
    ) {
      safety = 'high';
    }
  }

  if (action === 'flee') {
    return {
      result: {
        narration: v.narration,
        enemyNarration: v.enemyNarration,
        enemyHpDelta: 0,
        playerHpDelta: 0,
        resonanceDelta: Math.max(2, v.resonanceDelta),
        safety_concern: safety,
      },
      inputTokens,
      outputTokens,
    };
  }

  return {
    result: {
      narration: v.narration,
      enemyNarration: v.enemyNarration,
      enemyHpDelta: v.enemyHpDelta,
      playerHpDelta: v.playerHpDelta,
      resonanceDelta: v.resonanceDelta,
      safety_concern: safety,
    },
    inputTokens,
    outputTokens,
  };
}

/**
 * Mock — Gemini 키 없거나 실패 시 fallback. 룰 기반 묘사.
 *
 * 자살예방법 §27조의8 — userText 검사 포함.
 * dialogue 액션은 *진입할 tier* 기준 보너스 (그 턴부터).
 */
export function combatTurnMock(
  state: CombatState,
  action: CombatAction,
  userText?: string,
): CombatTurnResult {
  const safety = detectSafetyConcern(userText ?? '');

  if (action === 'attack') {
    return {
      narration: '너의 손이 익숙한 호선을 그린다. 잿빛 외투의 자락이 너의 결단을 받아낸다.',
      enemyNarration: '잊혀진 자가 한 발짝 물러선다. 안개 사이로 어렴풋한 윤곽이 흘러나온다.',
      enemyHpDelta: -15,
      playerHpDelta: -6,
      resonanceDelta: 2,
      safety_concern: safety,
    };
  }
  if (action === 'flee') {
    return {
      narration: '너는 등을 돌린다. 거리의 끝이 다시 멀어진다.',
      enemyNarration: '잊혀진 자는 너를 따라오지 않는다. 다만 너의 그림자만이 거리에 길게 남는다.',
      enemyHpDelta: 0,
      playerHpDelta: 0,
      resonanceDelta: 2,
      safety_concern: safety,
    };
  }
  // dialogue — 진입할 tier 기준 (그 턴부터 보너스)
  const v = DIALOGUE_BONUS[projectDialogueTier(state.resonance)];
  return {
    narration: v.n,
    enemyNarration: v.e,
    enemyHpDelta: v.eHp,
    playerHpDelta: v.pHp,
    resonanceDelta: v.r,
    safety_concern: safety,
  };
}
