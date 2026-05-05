/* MockLLMService — Phase 0 구현체.
 *
 * 실제 LLM 호출은 없다. 사전 작성된 풀에서 결정적 1개 선택 + 인위적 지연·스트리밍.
 * 체감 속도 1.5초 (v2.4 §28.4 — 응답 미리보기) 시뮬레이션. */

import type {
  CharacterSheet,
  CombatAction,
  CombatState,
  CombatTurnResult,
  NicknameCategory,
} from '@/types/game';
import type { LLMService } from './LLMService';
import { classifyByKeywords } from './mockData/nicknameCategoryRules';
import { pickTemplate } from './mockData/characterTemplates';
import { pickNarration } from './mockData/combatNarrations';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 스트리밍 시뮬레이션 — 30~50ms/character */
async function* streamChars(
  text: string,
  msPerChar = 35,
): AsyncGenerator<string, void, void> {
  for (const ch of text) {
    yield ch;
    await sleep(msPerChar);
  }
}

export class MockLLMService implements LLMService {
  async classifyNickname(nickname: string): Promise<NicknameCategory> {
    // 단계 1 (Flash-Lite) ~ 100~300ms 시뮬레이션
    await sleep(150 + Math.random() * 150);
    return classifyByKeywords(nickname);
  }

  async generateCharacter(
    nickname: string,
    category: NicknameCategory,
  ): Promise<CharacterSheet> {
    // 단계 2 (Haiku 4.5) ~ 800~1400ms 시뮬레이션
    await sleep(800 + Math.random() * 600);
    const t = pickTemplate(nickname, category);
    return {
      nickname,
      category,
      ...t,
      createdAt: Date.now(),
    };
  }

  /** 1턴 진행 — char 단위 스트리밍 후 마지막에 수치 결과 반환 */
  async *narrateCombat(
    state: CombatState,
    action: CombatAction,
  ): AsyncGenerator<string, CombatTurnResult, void> {
    // 첫 토큰 지연 — 0.4~0.7초 (Flash-Lite TTFT)
    await sleep(400 + Math.random() * 300);

    const hpRatio = state.enemy.hp / state.enemy.maxHp;
    const seed = (state.turn * 7 + action.length) >>> 0;
    const text = pickNarration(action, hpRatio, seed);

    for await (const ch of streamChars(text)) yield ch;

    // 액션별 수치 변화 (단순 결정론)
    const result: CombatTurnResult = (() => {
      switch (action) {
        case 'attack':
          return {
            narration: text,
            playerHpDelta: -8 - Math.floor(Math.random() * 6),
            playerStaminaDelta: -15,
            enemyHpDelta: -22 - Math.floor(Math.random() * 8),
            resonanceDelta: 1,
          };
        case 'dialogue':
          return {
            narration: text,
            playerHpDelta: -3,
            playerStaminaDelta: -5,
            enemyHpDelta: -14,
            resonanceDelta: 5, // 깊이 있는 선택 → 잔잔 ↑↑
          };
        case 'flee':
          return {
            narration: text,
            playerHpDelta: 0,
            playerStaminaDelta: -25,
            enemyHpDelta: 0,
            resonanceDelta: 2,
          };
      }
    })();

    return result;
  }
}

export const mockLLM = new MockLLMService();
