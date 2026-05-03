# 잔향(Resonance) — Project Context

> 이 파일은 Claude Code가 세션 시작 시 자동으로 읽는다.
> Boris Cherny 검증 루프 원칙: Claude가 사용자에게 "확인 부탁해요" 묻기 전에 *스스로* 검증할 수 있는 도구·URL·명령을 여기 명시한다.

---

## 한 줄 정의

**잔향 (Resonance: Echoes of a Forgotten Self)** — 닉네임 한 줄로 캐릭터의 인생이 만들어지고, 동네가 던전이 되는 한국향 LLM + GPS 텍스트 MMORPG.
한 줄 후크: *"당신의 이름은, 잔향이 된다."*

현재 단계: **Phase 0 검증 프로토타입** (mock LLM, 6 화면, 닉네임 A·D·H 분류).
다음 30일: **Phase 1 진입 준비** — 실 LLM 연결, 인증, 약관, APK 빌드, 디스코드 시드.

기획 전체 문서: `/tmp/resonance_extract/잔향_게임기획서_v1.0~v2.4_*.md` (저장소 외부, 시몬님 업로드).

---

## 스택

| 레이어 | 선택 | 위치 |
|---|---|---|
| 패키지 매니저 | **pnpm@10.33.0** | 단일 진실원: 루트 `package.json:packageManager` |
| 클라이언트 | Vite + React 18 + TypeScript + TailwindCSS + Zustand | `client/` |
| 모바일 | Capacitor 6 (Android 우선, iOS Phase 3) | `client/capacitor.config.ts` |
| 게임 렌더 | (Phase 0는 React+CSS만, Phaser 3는 Phase 1로 연기) | — |
| 백엔드 | Cloudflare Workers + Hono (Phase 0는 스텁) | `worker/` |
| 데이터 | (Phase 0는 localStorage, Phase 1+ D1 + KV + Durable Objects) | `worker/wrangler.toml` |
| LLM 라우팅 (Phase 1+) | Gemini Flash-Lite (전투/대화) · Claude Haiku 4.5 (캐릭터/창의) · Sonnet 4.6 (보스만) | `client/src/services/llm/` |
| 인증 (Phase 1+) | Clerk (10K MAU 무료) — 포트원 본인인증은 Phase 2 | — |
| CI/CD | GitHub Actions → GitHub Pages | `.github/workflows/pages.yml` |
| 스킬셋 | simon-stack vendor 모드 (orchestrators · simon-tdd · review · etc.) | `.claude/` |

---

## Verification Loop — Claude가 자기 작업 검증할 도구

### Dev 서버 (브라우저 검증)

```bash
pnpm install                 # 의존성 (10초)
pnpm dev                     # http://localhost:5173 — 모바일 사이즈로 봐야 정상
```

**브라우저 확인 시나리오 (90초 온보딩 검증)**:
1. "이름을 가진 자" 클릭 → 닉네임 입력 (5초)
2. `엄마` 입력 → A 카테고리, voice "그 이름을…" 스트리밍
3. `어둠` 입력 → D 카테고리, **자해 직접 묘사 절대 등장 금지** 확인
4. `민수` 입력 → H 카테고리 일반
5. 전투 5턴 내 결판
6. 결말 화면 → `localStorage['resonance:game']` 누적 잔잔 저장 확인

### 자동 검증 명령

```bash
pnpm typecheck               # tsc --noEmit (TS strict 통과해야)
pnpm test                    # vitest run (현재 4 tests / 닉네임 분류만)
pnpm build                   # vite build (170KB JS / 11KB CSS gzipped)
```

### 빌드 검증 (Android APK)

```bash
cd client
pnpm build && pnpm exec cap sync android
cd android && ./gradlew assembleDebug
# → client/android/app/build/outputs/apk/debug/app-debug.apk
```

> Android Studio + JDK 17 + Android SDK 34 필요. 이 저장소에 `client/android/`는 커밋되지 않음 (1회 직접 `cap add android`).

### 배포 검증 (GitHub Pages)

main 푸시 시 GitHub Actions 자동 빌드+배포.
- Workflow: `.github/workflows/pages.yml`
- 산출 URL: **https://simon-yhkim.github.io/Resonance/**
- Settings → Pages → Source: "GitHub Actions" 가 활성화되어 있어야 함.

### 워커 검증 (Phase 1+)

```bash
cd worker
pnpm wrangler dev            # 로컬 http://localhost:8787/api/health
pnpm wrangler deploy         # https://resonance-worker.<account>.workers.dev
```

---

## 핵심 파일 지도

| 영역 | 경로 |
|---|---|
| 화면 상태머신 | `client/src/App.tsx` (`screen` enum 6종 라우팅) |
| 6 화면 | `client/src/screens/{Title,NicknameInput,CharacterCreation,CharacterSheet,Combat,Result}Screen.tsx` |
| 공통 컴포넌트 | `client/src/components/{StreamingText,StatBar,VoiceBubble,ActionButton}.tsx` |
| 상태 관리 | `client/src/store/gameStore.ts` (Zustand + persist) |
| 도메인 타입 | `client/src/types/game.ts` (NicknameCategory, CharacterSheet, CombatState 등) |
| LLM 인터페이스 | `client/src/services/llm/LLMService.ts` |
| Mock 구현 | `client/src/services/llm/MockLLMService.ts` |
| **닉네임 분류 룰북** (USP) | `client/src/services/llm/mockData/nicknameCategoryRules.ts` |
| 캐릭터 템플릿 풀 | `client/src/services/llm/mockData/characterTemplates.ts` (A 5 / D 5 / H 8) |
| 전투 묘사 풀 | `client/src/services/llm/mockData/combatNarrations.ts` (액션 × HP구간 9종) |
| 디자인 토큰 | `client/src/styles/tokens.css` (어두운 파스텔 1프리셋 — Phase 1+ 3프리셋) |
| 워커 스텁 | `worker/src/index.ts` (`/api/health`만) |
| 빌드 워크플로 | `.github/workflows/pages.yml` |

---

## 안전 정책 — 절대 위반 금지

### 자해/자살 콘텐츠 (자살예방법 §19조의2 — 2년 이하 또는 2천만원 벌금)

- 닉네임 D 카테고리 (`자살`, `죽음`, `암` 등)는 **분류만** D로 하고, 캐릭터 변환 텍스트에서는 **자해의 방법·도구·과정·구체적 묘사 절대 금지**.
- 추상 어휘만 허용: "그림자", "어둠", "잿빛", "잊혀진", "여운".
- 룰북: `client/src/services/llm/mockData/nicknameCategoryRules.ts:14-22` (DARK_KEYWORDS).
- 템플릿: `client/src/services/llm/mockData/characterTemplates.ts:48-95` (TEMPLATES_D).
- Phase 1+ D 카테고리 변환 시 **자살예방상담 1393 안내 모달** 동시 노출 (계획됨).

### 실명·정치·종교·타 IP

- C(실명), F(정치/종교), G(타 IP) — Phase 0에서는 미구현. Phase 2+ 도입 시 v2.4 §27.2 변환 규칙 엄수.
- LLM 시스템 프롬프트에 정책 룰북 명시 (`worker/` 핸들러 작성 시점에 추가).

### Secrets

- API 키 코드 하드코딩 절대 금지. 모든 키는 Cloudflare Workers `wrangler secret put`.
- `.env*` 는 `.gitignore` 포함 확인 (이미 ✅).

---

## Skill Routing (simon-stack)

사용자 요청이 다음 패턴이면 해당 스킬을 Skill 도구로 호출:

| 사용자 발화 | 호출 스킬 |
|---|---|
| 디자인·UI·랜딩페이지 | `simon-design-first` (먼저 진단·레퍼런스·폰트 확정 후 코드) |
| 보안 점검·배포 전 보안 | `security-orchestrator` (5단계 순차) |
| 권한 시스템 설계 | `authz-designer` |
| Stripe·Toss·결제 API | `paid-api-guard` |
| 새 기능 구현 / 버그 수정 | `simon-tdd` (RED → GREEN → REFACTOR + 검증 루프) |
| 병렬 작업 / 동시 두 기능 | `simon-worktree` |
| 리서치·기술 비교·레퍼런스 수집 | `simon-research` (외부 소스 조사 후 plan) |
| 같은 실수 반복·"또 틀렸어" | `simon-instincts` (즉시 instincts 파일에 append) |
| 코드 리뷰·PR 검토 | `review` (gstack — 8영역 점검 + 자동 fix-first) |
| 디버깅·"이게 왜 안 돼" | `debug` 또는 `investigate` |
| 테스트 작성 | `test-gen` |
| 커밋 | `commit` |
| 새 앱 처음부터 | `app-dev-orchestrator` (21단계 마스터 파이프라인) |
| 게임 스토리·시나리오·캐릭터 백스토리·대사·월드빌딩·NPC·복선·여운 있는 결말 | `game-story-writer` (소설가·각본가·내러티브 디자이너 수준 작법 — 5대 비협상 원칙) |

전체 INDEX: `.claude/skills/INDEX.md`

---

## 작업 규칙

### Plan mode

세션 시작은 항상 Plan mode. 실행 전 사용자 승인 필수. (Boris Cherny 핵심 원칙)

### Plan 파일

- 진행 중 plan: `/root/.claude/plans/root-claude-uploads-937e3496-cac3-478c-floofy-beacon.md`
- 현재 plan: **30일 Phase 1 진입 sprint** (Week 1~4)

### Git 컨벤션

- 모든 작업은 별도 feature 브랜치에 (`claude/<주제>` 또는 `<주제>`)
- 절대로 main에 직접 push 금지
- PR 생성은 draft로 시작, 시몬님이 ready/merge 결정
- 머지 전 `/review` 스킬로 자동 검증
- 커밋 메시지: 본문 한국어, footer `https://claude.ai/code/session_...`

### 파괴적 명령

- `rm -rf`, `git reset --hard`, `git push --force`, `DROP TABLE`, `--no-verify` — 사용자 확인 없이 절대 금지
- 단, 자기 자신이 방금 만든 feature 브랜치의 force-push는 OK (다른 브랜치 영향 없음)

### Phase 0 비-목표 (의도적 제외)

실 LLM API 호출 (Phase 1), GPS (Phase 1+), 인증 (Phase 1), 광고/구독/IAP (Phase 2), 닉네임 카테고리 B/C/E/F/G (Phase 2+), 어린시절 보스 5체 (Phase 2), 길드/Durable Objects (Phase 2), Phaser 스프라이트 (Phase 1+).

---

## KPI 게이트 (30일 sprint 종료 시)

| KPI | 목표 | 미달 시 액션 |
|---|---|---|
| D1 retention | ≥ 35% | UX 개선 sprint 1회 더 |
| 90초 온보딩 도달률 | ≥ 80% | 1장 압축 + 응답 속도 튜닝 |
| 친구 5명 reaction | "한 번 더?" 3명 ≥ | 닉네임 카테고리 발견 트리거 강화 |
| LLM 비용 / DAU | < $0.05 | 모델 라우팅 + 캐싱 강화 |
| 디스코드 시드 | 50명 | CBT 인플루언서 1명 추가 |

미달 30일 + 30일 → 피벗 검토 (v2.4 §28.10) — GPS 제거 / 방구석 단독 / 장르 전환.

---

## 주요 인게임 워딩 (절대 일관성 유지)

| 한국어 | 영문 |
|---|---|
| 잔향 (殘響) | the Resonance |
| 이름을 가진 자 | the Named |
| 목소리 | the Voice |
| 잊혀진 자 | the Forgetter |
| 기억의 조각 | Remembrance Shard |
| 원의 자리 / 원의 아이 | the Origin / the Child of the Origin |
| 4대 키워드 | 희생 · 꿈과현실 · 어린시절 · 추억 |
