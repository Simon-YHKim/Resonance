# Changelog

> 잔향(Resonance) 변경 이력. 최신이 위.

---

## [Phase 1.7] — 2026-05-06 (자유 분석 모드)

### Changed — Schema 자유화 (사람을 알파벳으로 분류 X)
- `NicknameAnalysisSchema`: `category` enum **제거** (A·B·C·D·E·F·G·H 8종 폐기)
- 분석 부가 필드 (직업·연령·환경·정서·키워드·스토리매칭·NPC말투) **모두 OPTIONAL** — LLM 자율
- 새 필수 3필드: `the_Voice_호칭` · `description` (200~600자) · `safety_concern` (`none`|`high`)
- `toAlias`/`fromAlias` 영문 헬퍼 제거

### Added — 자살예방법 §27조의8 안전선
- `safety_concern` 필드 (NicknameAnalysis + CombatLLMResponse 양쪽)
- LLM 프롬프트: 자해·자살 직접 어휘·강한 암시 시 `high`, 단순 우울·체념은 `none`
- mobile-html + Expo 양쪽: `safety_concern=high` 시 1393 안내 모달 (자살예방상담)

### Added — Expo apps/mobile 풀 게임 흐름
- `app/character.tsx`: 잔향이 본 너 (description) + 잔향 코드 + Share API + safety 배너
- `app/combat.tsx`: HP 바 + 3 액션 + 자유 텍스트 (200자) + 턴 로그
- `app/result.tsx`: 4결말 카드 + 전체 로그
- `src/components/SafetyModal.tsx`: 1393 안내 (Linking.openURL('tel:1393'))
- `gameStore`: combat·outcome·safetyHigh·nicknameCode 확장

### Added — `packages/shared/src/client`
- `combatStart()` / `combatTurn(state, action, userText?)` / `getByCode(code)`
- `CombatStartBody` / `CombatTurnBody` export
- `AnalyzeSuccessBody.user_wiki.nickname_code`

### Fixed — `/api/character/by-code/:code`
- 응답에서 옛 `category` 필드 제거 (자유 분석 schema 호환)
- `safety_concern` 비공개 처리 (코드로 다른 사람 위험 노출 X)
- `the_Voice_호칭` + `description` 공개 추가

---

## [Phase 1.6] — 2026-05-06 (전투 + 잔향 코드)

### Added — 잊혀진 자 5턴 전투
- `POST /api/combat/start` — 초기 state (player HP 100 / enemy HP 60)
- `POST /api/combat/turn` — Gemini Flash-Lite 묘사 + 룰 기반 데미지
- 4결말 (`victory`/`defeat`/`fled`/`stalemate`) + 5턴 한도
- 자유 텍스트 입력 (max 200자) — 사용자 결이 묘사에 반영

### Added — plan9.kr/battle 영감 (잔향 코드)
- migration 0009 + 6자리 base32 UNIQUE (0/1/I/O 제외 — 사람이 읽기 쉬운 알파벳)
- `GET /api/character/code` (자기 코드 발급/조회)
- `GET /api/character/by-code/:code` (익명 wiki 조회)
- analyze 응답에 `nickname_code` 자동 포함

### Added — paid-api-guard 일일 비용 캡
- `src/lib/budget-guard.ts`: 사용자 $0.10/24h · 전 시스템 $1.00/24h
- `character/analyze`: 캡 도달 시 429 BUDGET_EXCEEDED ("오늘 잔향이 잦아드는 시간")
- `combat/turn`: 캡 도달 시 mock 강제
- `combat/turn` rate limit: 시간당 30턴 (5턴 × 6배틀)

---

## [Phase 1] — 2026-05-06

### Added — Worker (Cloudflare D1 + Hono)

#### D1 마이그레이션 9개 (Day 1)
- `users` (FK 의존성)
- `user_wiki` (사용자별 영구 컨텍스트 + 3축 점수)
- `user_modaem_collection` (모남 조각 영구 컬렉션)
- `user_skill_tree` (11카테고리 × 4Tier 스킬 트리)
- `user_macro` (WoW식 매크로)
- `street_mob_cache` (헥스별 LLM 생성 몹 캐시)
- `hex_metadata` (인구밀도·신호 강도)
- `llm_usage_log` (토큰 사용량 측정)
- `violation_log` (안전 위반 로그)

#### API 엔드포인트 (Day 2)
- `POST /api/character/analyze` — 닉네임 → user_wiki
- `GET /api/character/wiki` — 현재 사용자 wiki 조회
- 모든 응답 한국어 + Conventional error codes

#### LLM 통합 (Day 2~3)
- Anthropic SDK 통합 (Claude Haiku 4.5)
- Mock fallback (ANTHROPIC_API_KEY 미설정 시 자동)
- `callLLMWithWiki()` 단일 진입점 — 모든 LLM 호출이 거침
- 자동 user_wiki 컨텍스트 주입 (the_Voice 호칭·직업·정서·우세 축)
- 자동 토큰 사용량 + 비용 로깅
- 안전 가이드라인 매 프롬프트 강제 (미성년자 + 1393 + 한국어)

#### Zod 검증 (Day 2)
- `NicknameAnalysisSchema` — wire format 한국어 키
- `NicknameAnalysisAlias` — TS 영문 alias (toAlias / fromAlias)
- 11카테고리 enum / 5체 보스 자리 / 호칭 모두 검증

#### Rate Limit (Day 5)
- POST /analyze 사용자당 시간당 5회
- D1 기반 (`llm_usage_log` count)
- 429 RATE_LIMITED + retry_after_ms

#### 인증 (Day 2)
- Phase 1: `X-Dev-User-Id` 헤더 placeholder
- Phase 1.5에 Clerk 통합 예정 (`getCurrentUserId(c)` 인터페이스 동일)

### Changed
- `wrangler.toml`: D1 binding 활성화 + migrations_dir 명시
- root `package.json`: `pnpm -r` flag (worker scripts 포함)

### Security (Day 5)
- 시크릿 하드코딩 검색: 0건 ✅
- `.env` / `.dev.vars` git 추적: 0건 ✅
- 모든 D1 쿼리 prepared statements (SQL injection 안전) ✅
- `.gitignore`: `.dev.vars` / `.dev.vars.local` / `coverage/` / `*.sqlite` 추가
- `.dev.vars.example`: ANTHROPIC_API_KEY + 라우팅 + Phase 1.5+ 변수 자리

### Tests (Day 2~5)
- 단위 테스트 6 파일 (validateNickname / mockAnalyze / analyzeNickname / Zod / wiki injection / llm / rate-limit)
- E2E 4 시나리오 + 13 테스트 (analyze flow / wiki injection / fallback / token tracking / rate limit)
- **총 85 테스트 통과 / 커버리지 95.21%** (목표 80%+)

### Docs (Day 6)
- `worker/README.md` — 엔드포인트 / 빠른 시작 / 폴더 구조 / 안전 정책
- `worker/openapi.yaml` — OpenAPI 3.0 명세 (3 엔드포인트 + 스키마)
- `worker/migrations/README.md` — 마이그레이션 가이드 + 룰
- `CHANGELOG.md` — 이 파일

### Dependencies
- `+ @anthropic-ai/sdk ^0.93.0`
- `+ zod ^4.4.3`
- `+ vitest ^2.1.9` (dev)
- `+ @vitest/coverage-v8 ^2.1.9` (dev)

---

## [Phase 0] — 2026-04-25 ~ 2026-04-30

### Added — Client (Vite + React + TS)
- TitleScreen / NicknameInputScreen / CharacterCreationScreen
- CharacterSheetScreen / CombatScreen / ResultScreen
- HearthScreen (기억의 향로 로비) / MapScreen (4×4 GPS Mock)
- BestiaryScreen / NPC / Shop / 자유 텍스트 입력
- MockLLMService (LLM 인터페이스 + 룰 기반 분류)
- 닉네임 카테고리 A·D·H 룰북
- 5체 보스 archetype + 동명 몹 ±10% HP variance
- 잔잔 누적 (BOTW식) + tier 진행
- 기억의 조각 (5체 보스 드롭)

### Infrastructure
- pnpm workspace + Vite + Tailwind + Zustand
- Capacitor (Android)
- GitHub Actions → GitHub Pages 배포

---

> ***"잔향이 — 잠시, 머물렀어요."***
