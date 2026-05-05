# 잔향 D1 마이그레이션 가이드

> Phase 1: 9개 테이블 (`0000_users` + 시스템 명세 v1.4 §6.1 의 8개)

---

## 마이그레이션 목록

| # | 파일 | 테이블 | 역할 |
|---|---|---|---|
| 0000 | `0000_users.sql` | `users` | FK 의존성 (Clerk 통합 전 placeholder) |
| 0001 | `0001_user_wiki.sql` | `user_wiki` | 사용자별 영구 컨텍스트 (3축 점수 포함) |
| 0002 | `0002_user_modaem_collection.sql` | `user_modaem_collection` | 모남 조각 (대/소) 영구 컬렉션 |
| 0003 | `0003_user_skill_tree.sql` | `user_skill_tree` | 11카테고리 × 4Tier 스킬 트리 |
| 0004 | `0004_user_macro.sql` | `user_macro` | WoW식 매크로 ("/황당발언" 등) |
| 0005 | `0005_street_mob_cache.sql` | `street_mob_cache` | 헥스별 LLM 생성 몹 캐시 (5변주) |
| 0006 | `0006_hex_metadata.sql` | `hex_metadata` | 인구밀도·신호 강도 |
| 0007 | `0007_llm_usage_log.sql` | `llm_usage_log` | 토큰 사용량·비용 측정 |
| 0008 | `0008_violation_log.sql` | `violation_log` | 안전 위반 로그 (자해·미성년자 보호) |

각 `.sql` 마이그레이션마다 `.down.sql` 롤백 파일이 동봉됩니다.

---

## 적용 — 로컬 (Phase 1 검증)

```bash
cd worker

# 1. D1 데이터베이스 1회 생성 (사용자 1회)
pnpm wrangler d1 create resonance-d1
# → wrangler.toml 의 [[d1_databases]] database_id 채움

# 2. 모든 마이그레이션 적용 (순서 자동)
pnpm wrangler d1 migrations apply resonance-d1 --local

# 3. 적용 확인
pnpm wrangler d1 execute resonance-d1 --local \
  --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
# → users, user_wiki, user_modaem_collection, ... 9개
```

## 적용 — 프로덕션 (Phase 1 머지 후)

```bash
pnpm wrangler d1 migrations apply resonance-d1 --remote
```

> **⚠ 파괴적 명령**: `--remote` 적용 전 *반드시 사용자 명시 확인*. 운영 데이터 영향.

---

## 롤백

```bash
# 마지막 마이그레이션 롤백 (순서 역순)
pnpm wrangler d1 execute resonance-d1 --local --file=migrations/0008_violation_log.down.sql
pnpm wrangler d1 execute resonance-d1 --local --file=migrations/0007_llm_usage_log.down.sql
# ...
```

---

## 새 마이그레이션 추가 룰

1. 번호는 4자리 zero-pad (`0009_`, `0010_` ...)
2. 짝으로 `.sql` + `.down.sql` 둘 다 작성
3. `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` 사용 (idempotent)
4. FK는 `ON DELETE CASCADE` (사용자 탈퇴 시 자동 정리)
5. 한글·이모지·자유 텍스트 칼럼은 `TEXT` (D1 SQLite는 UTF-8)
6. 시간은 `INTEGER` (ms timestamp, UTC)
7. 불리언은 `INTEGER CHECK (col IN (0, 1))`
8. enum은 `CHECK (col IN ('a', 'b', ...))`

---

## 시드 데이터 (Phase 1 테스트용)

테스트는 `worker/src/__tests__/fixtures/` 의 시드 SQL 사용. 프로덕션은 시드 없음.

---

## 인게임 워딩 (절대 변경 X)

스키마·코멘트에서 사용:
- 잔향(殘響) / 원 / 원의 자리
- 이름을 가진 사람 (the Named) / 목소리 (the Voice) / 잊혀진 자 (the Forgetter)
- 모남 조각 (대/소) / 꿈자국 조각 / 잔잔(殘殘) / 사라짐 / 건너기 / 남은 자리

영문 alias:
- 잔향 → resonance / 원 → origin / 모남 → modaem / 꿈자국 → dream-trace
- 잔잔 → janjan / 사라짐 → vanish / 건너기 → cross / 남은 자리 → anchor

> ***"잔향이 — 잠시, 머물렀어요."***
