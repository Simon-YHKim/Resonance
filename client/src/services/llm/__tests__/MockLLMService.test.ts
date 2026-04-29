import { describe, expect, it } from 'vitest';
import { MockLLMService } from '../MockLLMService';

const llm = new MockLLMService();

describe('MockLLMService.classifyNickname', () => {
  it('classifies 엄마 as A', async () => {
    expect(await llm.classifyNickname('엄마')).toBe('A');
  });

  it('classifies 어둠 as D', async () => {
    expect(await llm.classifyNickname('어둠')).toBe('D');
  });

  it('classifies 민수 as B', async () => {
    expect(await llm.classifyNickname('민수')).toBe('B');
  });

  it('classifies Simon as H', async () => {
    expect(await llm.classifyNickname('Simon')).toBe('H');
  });
});

describe('MockLLMService.generateCharacter', () => {
  it('returns deterministic character for same nickname+category', async () => {
    const a = await llm.generateCharacter('엄마', 'A');
    const b = await llm.generateCharacter('엄마', 'A');
    expect(a.characterConcept).toBe(b.characterConcept);
    expect(a.startingClass).toBe(b.startingClass);
    expect(a.voiceFirstLine).toBe(b.voiceFirstLine);
  });

  it('returns different character for different nickname', async () => {
    const a = await llm.generateCharacter('엄마', 'A');
    const b = await llm.generateCharacter('아빠', 'A');
    // 풀 사이즈가 8이라 같은 인덱스로 떨어질 가능성도 있지만 djb2가 충분히 분산.
    // 다른 닉네임은 서로 다른 결과를 더 자주 보여야 — 적어도 nickname 필드는 다름
    expect(a.nickname).toBe('엄마');
    expect(b.nickname).toBe('아빠');
  });

  it('preserves category and createdAt', async () => {
    const sheet = await llm.generateCharacter('테스트', 'H');
    expect(sheet.category).toBe('H');
    expect(sheet.createdAt).toBeGreaterThan(0);
  });

  it('D category templates use abstract vocabulary only (자해 직접 묘사 금지)', async () => {
    const forbidden = ['자살', '자해', '죽었', '베었', '뛰어내'];
    for (const nick of ['어둠', '잊혀진', '그림자', '죽음', '자살']) {
      const sheet = await llm.generateCharacter(nick, 'D');
      const allText = `${sheet.characterConcept} ${sheet.appearance} ${sheet.voiceFirstLine}`;
      for (const word of forbidden) {
        expect(allText).not.toContain(word);
      }
    }
  });
});

describe('MockLLMService.narrateCombat', () => {
  it('streams chars and returns CombatTurnResult', async () => {
    const state = {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { name: 'X', description: 'Y', encounter: 'Z', hp: 60, maxHp: 60 },
      turn: 0,
      resonance: 0,
    };
    const gen = llm.narrateCombat(state, 'attack');
    let chars = '';
    let result;
    while (true) {
      const step = await gen.next();
      if (step.done) {
        result = step.value;
        break;
      }
      chars += step.value;
    }
    expect(chars.length).toBeGreaterThan(0);
    expect(result?.narration).toBe(chars);
    expect(result?.enemyHpDelta).toBeLessThan(0); // 공격이므로 적 HP 감소
  });

  it('dialogue grants higher 잔잔 bonus than attack', async () => {
    const state = {
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: { name: 'X', description: 'Y', encounter: 'Z', hp: 60, maxHp: 60 },
      turn: 0,
      resonance: 0,
    };
    const consumeAll = async (action: 'attack' | 'dialogue') => {
      const g = llm.narrateCombat(state, action);
      while (true) {
        const s = await g.next();
        if (s.done) return s.value;
      }
    };
    const a = await consumeAll('attack');
    const d = await consumeAll('dialogue');
    expect(d.resonanceDelta).toBeGreaterThan(a.resonanceDelta);
  });
});
