# 잔향(Resonance) Worker — Phase 1

> Cloudflare Workers + Hono + D1.
> Phase 0 placeholder 였던 워커가 Phase 1 으로 진입했습니다.

---

## 엔드포인트

| Method | Path | 역할 | 인증 |
|---|---|---|---|
| `GET` | `/api/health` | 헬스체크 + 활성 엔드포인트 목록 | X |
| `POST` | `/api/character/analyze` | 닉네임 → user_wiki 분석·저장 | `X-Dev-User-Id` |
| `GET` | `/api/character/wiki` | 현재 사용자 wiki 조회 | `X-Dev-User-Id` |

상세 API 명세: [`openapi.yaml`](./openapi.yaml).

---

## D1 스키마 (9개 테이블)

| 번호 | 테이블 | 역할 |
|---|---|---|
| 0000 | `users` | FK 의존성 (Clerk 통합 전 placeholder) |
| 0001 | `user_wiki` | 사용자별 영구 컨텍스트 + 3축 점수 |
| 0002 | `user_modaem_collection` | 모남 조각 (대/소) 영구 컬렉션 |
| 0003 | `user_skill_tree` | 11카테고리 × 4Tier 스킬 트리 |
| 0004 | `user_macro` | WoW식 매크로 ("/황당발언" 등) |
| 0005 | `street_mob_cache` | 헥스별 LLM 생성 몹 캐시 (5변주) |
| 0006 | `hex_metadata` | 인구밀도·신호 강도 |
| 0007 | `llm_usage_log` | 토큰 사용량·비용 측정 |
| 0008 | `violation_log` | 안전 위반 로그 (자해·미성년자 보호) |

상세: [`migrations/README.md`](./migrations/README.md).

---

## 빠른 시작

```bash
cd worker
pnpm install

# 1. .dev.vars 생성 (시크릿)
cp .dev.vars.example .dev.vars
# → ANTHROPIC_API_KEY 채움. 미설정 시 자동 mock fallback (개발 friendly).

# 2. D1 1회 생성
pnpm wrangler d1 create resonance-d1
# → wrangler.toml 의 database_id 채움

# 3. 마이그레이션 적용 (로컬)
pnpm wrangler d1 migrations apply resonance-d1 --local

# 4. dev 서버
pnpm dev
# → http://localhost:8787

# 5. 단위 + E2E 테스트
pnpm test
pnpm test:coverage   # 95.21% lines / 100% functions
pnpm typecheck
```

---

## 스택

```
Hono 4.6                    — 라우팅
Cloudflare D1               — 영구 저장 (SQLite)
Cloudflare Workers Types    — 타입
Anthropic SDK 0.93          — Claude Haiku 4.5
Zod 4.4                     — Wire format 검증
Vitest 2.1                  — 단위 + E2E 테스트
```

---

## 폴더 구조 (code-health-guard 레이어드)

```
worker/
├── migrations/              # 9 SQL + 9 down + README
├── src/
│   ├── index.ts             # Hono app entry
│   ├── routes/              # HTTP 핸들러
│   │   └── character.ts     # POST /analyze, GET /wiki
│   ├── middleware/          # 횡단 관심사
│   │   ├── auth.ts          # X-Dev-User-Id (Phase 1.5 → Clerk)
│   │   ├── rate-limit.ts    # paid-api-guard
│   │   └── wiki-injection.ts # LLM 컨텍스트 자동 주입
│   ├── lib/                 # 도메인 로직
│   │   ├── nickname-analyzer.ts # Mock + Anthropic Haiku
│   │   ├── llm.ts           # callLLMWithWiki 단일 진입점
│   │   ├── wiki-store.ts    # user_wiki upsert
│   │   └── usage-logger.ts  # llm_usage_log
│   ├── schemas/             # Zod
│   │   └── nickname-analysis.ts
│   ├── types/               # TS 타입
│   │   └── bindings.ts      # Cloudflare Env
│   └── __tests__/           # E2E + helpers
│       ├── e2e.test.ts
│       └── helpers/test-db.ts
├── wrangler.toml
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

import 방향: `routes` → `middleware` → `lib` → `schemas` → `types`.

---

## 안전 정책 (절대 위반 X)

### 자해/자살 (자살예방법 §19조의2)

- 닉네임 `D` 카테고리 분류만 LLM. 변환 텍스트에서 *자해 직접 묘사 금지*.
- 추상 어휘만 허용: "그림자" / "어둠" / "잿빛" / "잊혀진" / "여운".
- Phase 4 검열: 사용자 입력에서 자해 표현 감지 → 따뜻한 톤 팝업 + 1393 안내.

### Secrets

- API 키 코드 하드코딩 절대 금지. 모든 키는 `.dev.vars` (로컬) 또는 `wrangler secret put` (프로덕션).
- `.env*` / `.dev.vars*` 는 `.gitignore` 등록 확인 (이미 ✅).

### 인증 (Phase 1)

- 현재 `X-Dev-User-Id` 헤더 (개발 friendly).
- Phase 1.5 에 Clerk JWT 검증으로 교체. 인터페이스 동일 (`getCurrentUserId(c)`).

### Rate Limit

- `POST /api/character/analyze` 사용자당 시간당 5회.
- 시간당 호출 수는 `llm_usage_log` 카운트로 측정.

---

## 인게임 워딩 (절대 변경 X)

| 한국어 | 영문 alias |
|---|---|
| 잔향(殘響) | resonance |
| 원 / 원의 자리 | origin / the Origin |
| 이름을 가진 사람 | the Named |
| 목소리 | the Voice |
| 잊혀진 자 | the Forgetter |
| 모남 조각 | modaem shard |
| 꿈자국 조각 | dream-trace shard |
| 잔잔(殘殘) | janjan |
| 사라짐 | vanish |
| 건너기 | cross |
| 남은 자리 | anchor |

---

## 다음 (Phase 2~5)

| Phase | 산출물 |
|---|---|
| 2 | 모남 11카테고리 × 4Tier 스킬 트리 + WoW 매크로 시스템 |
| 3 | 길거리 몹 LLM 생성 (`POST /api/mob/generate`) + 5변주 캐싱 |
| 4 | 인구밀도 (KOSIS) + 안전 시스템 (미성년자 검열) |
| 5 | 통합 테스트 + 알파 빌드 + 디스코드 CBT 200명 |

---

> ***"잔향이 — 잠시, 머물렀어요."***
