/**
 * 테스트용 in-memory D1 — sql.js or 단순 Map.
 *
 * Phase 1 단순화: better-sqlite3 / wrangler dev 의존 없이
 * 핵심 쿼리 (user_wiki·llm_usage_log·users) 흉내내는 stub.
 *
 * Day 4 E2E 시나리오용. Phase 2+ 에서 실제 D1 통합 테스트 (wrangler test) 도입.
 */

interface Tables {
  users: Map<string, any>;
  user_wiki: Map<string, any>;
  llm_usage_log: any[];
  user_stamina: Map<string, any>;
}

export interface TestD1 extends D1Database {
  __tables: Tables;
}

/**
 * 매우 단순한 D1 stub.
 * D1.prepare(sql).bind(...).run()/.first() 모양만 흉내.
 *
 * 실 마이그레이션 적용은 X (pure JS Map). 칼럼 매칭은 SQL prefix 검사.
 */
export function createTestD1(): TestD1 {
  const tables: Tables = {
    users: new Map(),
    user_wiki: new Map(),
    llm_usage_log: [],
    user_stamina: new Map(),
  };

  function makePreparedStatement(sql: string) {
    let bindings: any[] = [];
    const stmt = {
      bind(...args: any[]) {
        bindings = args;
        return stmt;
      },
      async first<T = any>() {
        const lower = sql.trim().toLowerCase();
        if (lower.startsWith('select * from user_wiki where user_id = ?')) {
          return (tables.user_wiki.get(bindings[0]) ?? null) as T | null;
        }
        if (lower.startsWith('select * from users where id = ?')) {
          return (tables.users.get(bindings[0]) ?? null) as T | null;
        }
        if (lower.startsWith('select nickname_code from user_wiki where user_id = ?')) {
          const row = tables.user_wiki.get(bindings[0]);
          return (row ? { nickname_code: row.nickname_code ?? null } : null) as T | null;
        }
        if (lower.startsWith('select user_id from user_wiki where user_id = ?')) {
          const row = tables.user_wiki.get(bindings[0]);
          return (row ? { user_id: row.user_id } : null) as T | null;
        }
        if (lower.startsWith('select user_id, nickname_analysis_json from user_wiki where nickname_code = ?')) {
          const code = bindings[0];
          for (const row of tables.user_wiki.values()) {
            if (row.nickname_code === code) {
              return { user_id: row.user_id, nickname_analysis_json: row.nickname_analysis_json } as T;
            }
          }
          return null as T | null;
        }
        if (lower.startsWith('select current, max_daily, last_reset_at from user_stamina')) {
          return (tables.user_stamina.get(bindings[0]) ?? null) as T | null;
        }
        if (lower.startsWith('select') && lower.includes('llm_usage_log')) {
          // rate-limit: SELECT COUNT(*) FROM llm_usage_log WHERE user_id=? AND context=? AND timestamp>=?
          if (lower.includes('and context') && bindings.length === 3) {
            const [userId, ctx, fromMs] = bindings;
            const filtered = tables.llm_usage_log.filter(
              (e) =>
                e.user_id === userId && e.context === ctx && e.timestamp >= fromMs,
            );
            return { calls: filtered.length } as T;
          }
          // daily 집계: SELECT SUM(...), COUNT(*), SUM(cost_usd) WHERE user_id=? AND timestamp>=?
          const userId = bindings[0];
          const fromMs = bindings[1] ?? 0;
          const filtered = tables.llm_usage_log.filter(
            (e) => e.user_id === userId && e.timestamp >= fromMs,
          );
          return {
            tokens: filtered.reduce(
              (sum, e) => sum + e.input_tokens + e.output_tokens,
              0,
            ),
            calls: filtered.length,
            cost_usd: filtered.reduce((sum, e) => sum + e.cost_usd, 0),
          } as T;
        }
        return null as T | null;
      },
      async run() {
        const lower = sql.trim().toLowerCase();
        if (lower.startsWith('insert or ignore into users')) {
          const [id, , , createdAt, updatedAt] = bindings;
          if (!tables.users.has(id)) {
            tables.users.set(id, {
              id,
              email: null,
              display_name: null,
              created_at: createdAt,
              updated_at: updatedAt,
              age_gate_passed: 0,
            });
          }
          return { success: true, meta: { changes: 0 } } as any;
        }
        if (lower.startsWith('insert into user_wiki')) {
          const [userId, json, createdAt, updatedAt] = bindings;
          const existing = tables.user_wiki.get(userId);
          tables.user_wiki.set(userId, {
            user_id: userId,
            nickname_analysis_json: json,
            speech_pattern_json: null,
            frequent_words: null,
            milestones_json: null,
            gaehwa_axis: 0,
            yeojeon_axis: 0,
            hangno_axis: 0,
            axis_locked_at: null,
            context_change_log_json: null,
            nickname_code: existing?.nickname_code ?? null,
            created_at: createdAt,
            updated_at: updatedAt,
          });
          return { success: true, meta: { changes: 1 } } as any;
        }
        if (lower.startsWith('update user_wiki set nickname_code')) {
          const [code, userId] = bindings;
          const row = tables.user_wiki.get(userId);
          if (row && row.nickname_code == null) {
            row.nickname_code = code;
            return { success: true, meta: { changes: 1 } } as any;
          }
          return { success: true, meta: { changes: 0 } } as any;
        }
        if (lower.startsWith('insert into user_stamina')) {
          const [uid, current, maxDaily, lastResetAt, createdAt, updatedAt] = bindings;
          tables.user_stamina.set(uid, {
            user_id: uid,
            current,
            max_daily: maxDaily,
            last_reset_at: lastResetAt,
            total_purchased: 0,
            total_consumed: 0,
            created_at: createdAt,
            updated_at: updatedAt,
          });
          return { success: true, meta: { changes: 1 } } as any;
        }
        if (lower.startsWith('update user_stamina set current = max_daily')) {
          const [resetAt, updatedAt, uid] = bindings;
          const row = tables.user_stamina.get(uid);
          if (row) {
            row.current = row.max_daily;
            row.last_reset_at = resetAt;
            row.updated_at = updatedAt;
          }
          return { success: true, meta: { changes: row ? 1 : 0 } } as any;
        }
        if (lower.startsWith('update user_stamina') && lower.includes('current = current -')) {
          const [cost, _consumed, updatedAt, uid, minCurrent] = bindings;
          const row = tables.user_stamina.get(uid);
          if (row && row.current >= minCurrent) {
            row.current -= cost;
            row.total_consumed += cost;
            row.updated_at = updatedAt;
            return { success: true, meta: { changes: 1 } } as any;
          }
          return { success: true, meta: { changes: 0 } } as any;
        }
        if (lower.startsWith('update user_stamina') && lower.includes('current = current +')) {
          const [amount, _purchased, updatedAt, uid] = bindings;
          const row = tables.user_stamina.get(uid);
          if (row) {
            row.current += amount;
            row.total_purchased += amount;
            row.updated_at = updatedAt;
            return { success: true, meta: { changes: 1 } } as any;
          }
          return { success: true, meta: { changes: 0 } } as any;
        }
        if (lower.startsWith('insert into llm_usage_log')) {
          const [userId, model, inTok, outTok, cost, ctx, isPrem, ts] = bindings;
          tables.llm_usage_log.push({
            user_id: userId,
            llm_model: model,
            input_tokens: inTok,
            output_tokens: outTok,
            cost_usd: cost,
            context: ctx,
            is_premium: isPrem,
            timestamp: ts,
          });
          return { success: true, meta: { changes: 0 } } as any;
        }
        return { success: true, meta: { changes: 0 } } as any;
      },
    };
    return stmt;
  }

  const db = {
    prepare(sql: string) {
      return makePreparedStatement(sql);
    },
    __tables: tables,
  } as unknown as TestD1;

  return db;
}
