import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../rate-limit';
import { createTestD1 } from '../../__tests__/helpers/test-db';

describe('checkRateLimit', () => {
  it('호출 0 → allowed', async () => {
    const db = createTestD1();
    const r = await checkRateLimit(db, 'user_a', 'character_gen', 5);
    expect(r.allowed).toBe(true);
    expect(r.callsInWindow).toBe(0);
    expect(r.limit).toBe(5);
  });

  it('호출 4 → allowed (limit 5)', async () => {
    const db = createTestD1();
    const now = Date.now();
    for (let i = 0; i < 4; i++) {
      db.__tables.llm_usage_log.push({
        user_id: 'user_a',
        llm_model: 'mock',
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        context: 'character_gen',
        is_premium: 0,
        timestamp: now - i * 60_000,
      });
    }
    const r = await checkRateLimit(db, 'user_a', 'character_gen', 5);
    expect(r.allowed).toBe(true);
    expect(r.callsInWindow).toBe(4);
  });

  it('호출 5 → blocked (limit 5)', async () => {
    const db = createTestD1();
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      db.__tables.llm_usage_log.push({
        user_id: 'user_a',
        llm_model: 'mock',
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        context: 'character_gen',
        is_premium: 0,
        timestamp: now - i * 60_000,
      });
    }
    const r = await checkRateLimit(db, 'user_a', 'character_gen', 5);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it('다른 context 호출은 별개 카운트', async () => {
    const db = createTestD1();
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      db.__tables.llm_usage_log.push({
        user_id: 'user_a',
        llm_model: 'mock',
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        context: 'battle', // analyze 와 무관
        is_premium: 0,
        timestamp: now - i * 60_000,
      });
    }
    const r = await checkRateLimit(db, 'user_a', 'character_gen', 5);
    expect(r.allowed).toBe(true);
    expect(r.callsInWindow).toBe(0);
  });

  it('1시간 이전 호출은 카운트 X', async () => {
    const db = createTestD1();
    const now = Date.now();
    // 2시간 전 호출 5회
    for (let i = 0; i < 5; i++) {
      db.__tables.llm_usage_log.push({
        user_id: 'user_a',
        llm_model: 'mock',
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        context: 'character_gen',
        is_premium: 0,
        timestamp: now - 2 * 60 * 60 * 1000 - i * 1000,
      });
    }
    const r = await checkRateLimit(db, 'user_a', 'character_gen', 5);
    expect(r.allowed).toBe(true);
  });

  it('다른 사용자 호출은 별개', async () => {
    const db = createTestD1();
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      db.__tables.llm_usage_log.push({
        user_id: 'user_b',
        llm_model: 'mock',
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        context: 'character_gen',
        is_premium: 0,
        timestamp: now,
      });
    }
    const r = await checkRateLimit(db, 'user_a', 'character_gen', 5);
    expect(r.allowed).toBe(true);
  });
});
