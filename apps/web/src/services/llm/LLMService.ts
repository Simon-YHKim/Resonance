/* LLM 서비스 인터페이스 — 기획서 v1.0 §1-2 라우팅 표
 *
 * Phase 0: MockLLMService 구현체
 * Phase 1+: AnthropicHaikuService (캐릭터 생성), GeminiFlashLiteService (전투/대화) 로 교체
 *
 * 라우팅 정책 (Phase 1):
 *   classifyNickname    → Gemini 2.5 Flash-Lite ($0.10 / $0.40)
 *   generateCharacter   → Claude Haiku 4.5 ($1 / $5, cache_control)
 *   narrateCombat       → Gemini 2.5 Flash-Lite + 스트리밍
 */

import type {
  CharacterSheet,
  CombatAction,
  CombatState,
  CombatTurnResult,
  NicknameCategory,
} from '@/types/game';

export interface LLMService {
  /** 단계 1: 닉네임 8분류 → Phase 0는 A/D/H 3분류 */
  classifyNickname(nickname: string): Promise<NicknameCategory>;

  /** 단계 2: 캐릭터 시트 생성 (1회/계정) */
  generateCharacter(
    nickname: string,
    category: NicknameCategory,
  ): Promise<CharacterSheet>;

  /** 전투 1턴 묘사 — 스트리밍 (첫 토큰 < 1.5초 목표, v2.4 §28.4) */
  narrateCombat(
    state: CombatState,
    action: CombatAction,
  ): AsyncGenerator<string, CombatTurnResult, void>;
}
