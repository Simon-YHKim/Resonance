# Changelog

> 잔향(Resonance) 변경 이력. 최신이 위.

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
