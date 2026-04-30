# 잔향 — Resonance: Echoes of a Forgotten Self

> 당신의 이름은, 잔향이 된다.

LLM 기반 GPS 텍스트 MMORPG의 **Phase 0 검증 프로토타입**.
한 줄 후크: *"이름을 한 줄 입력하면, the Voice가 당신만의 캐릭터를 만들어 잔향의 거리로 보낸다."*

> **메인 주제 (v1.2 진실의 원천):**
> 잔향은 — 사회에 맞춰지며 잘려나간 자기와 한 번도 되어보지 못한 자기를, 한 조각씩 다시 만나며, 내 안에 살아 있는 모든 가능성을 다시 그리는 이야기다.

이 저장소는 v1.0 §6 **Phase 0** 단계의 구현체. 기획서는 `docs/`에 정리되어 있다 (진실의 원천 = v1.2).

---

## 📚 문서 — 가장 먼저 읽어야 할 것

| 우선순위 | 문서 | 시간 |
|---|---|---|
| 1 | `docs/00_START_HERE/PROJECT_SUMMARY.md` | 3분 (전체 그림) |
| 2 | `docs/00_START_HERE/READ_ORDER.md` | 1분 (가이드) |
| 3 | `docs/01_CORE_DECISIONS/01_종합정리_v1.2_*.md` | 20분 (진실의 원천) |
| 4 | `docs/02_WORLDBUILDING/` | 60분 (세계관·캐릭터) |
| 5 | `docs/03_SYSTEM_SPECS/` | 시스템 명세 (필요 시 참조) |

**충돌 해결**: v1.2 종합정리 > v1.1 > v1.0 > 세계관 바이블 v0.1 > 캐릭터 도감 v0.2 > v2.4 > v2.3 > v2.2 > v2.1 > v2.0

---

## 무엇이 들어 있나

| 화면 | 흐름 |
|---|---|
| `TitleScreen` | "이름을 가진 자" CTA + 마지막 캐릭터 미리보기 + reset (두 단계 confirm) |
| `NicknameInputScreen` | the Voice의 첫 발화 + 닉네임 입력 (1~12자) + 입력 검증 hint |
| `CharacterCreationScreen` | 분류(`classify`) → 캐릭터 생성(`generate`) → voice 첫 줄 스트리밍 |
| `CharacterSheetScreen` | 컨셉·외형·시작 클래스·연결 키워드 + 잔향의 기록 (분류·만남수·생성일) |
| `CombatScreen` | 잊혀진 자 5체 (잔잔 tier별 분기) / 공격·대화·도망 / 5턴 제한 |
| `ResultScreen` | 승·패·도망 결말 + 카테고리 footer + tier 승급 + 누적 잔잔 +N |

핵심 USP는 **닉네임 → LLM 변환**(기획서 v2.4 §27).
Phase 0는 카테고리 **A / B / D / H** 4종을 키워드 매칭으로 모킹한다 — 실 LLM 연결은 Phase 1.

| 카테고리 | 의미 | 처리 |
|---|---|---|
| A | 가족 호칭 (`엄마`, `아빠`, `Mom`, `누나`, …) | 어린시절·추억 키워드 강한 캐릭터 템플릿 5종 |
| B | 보편 한국 이름 (`민수`, `지영`, …) | 동명이인의 잔향 톤, resonanceLink 보너스 |
| D | 위험 단어 (`어둠`, `그림자`, `잊혀진`, `자살`, …) | 그림자/잿빛 추상 어휘만 — 자해 직접 묘사 절대 금지 |
| H | 그 외 일반 닉네임 | 표준 RPG 캐릭터 템플릿 8종 |

같은 닉네임은 djb2 해시로 **결정적**으로 같은 템플릿에 매핑 → 어뷰저 도배 차단.

## 잔향 누적 시스템 (v2.3 BOTW 진행)

매 전투의 결과(잔잔)가 누적되어 5단계 tier로 진행. tier마다 액션 효과·메시지·보스가 변화:

| Tier | 잔잔 | 호칭 | 보스 | dialogue +잔잔 | attack ×데미지 |
|---|---|---|---|---|---|
| novice | 0~49 | 처음 온 자 | 어린 시절의 잔해 (HP 60) | +0 | 1.0× |
| echo | 50~149 | 잔향이 머무는 자 | 청소년의 침묵 (HP 75) | +3 | 1.0× |
| resonant | 150~399 | 잔향과 함께 걷는 자 | 어른의 가면 (HP 95) | +6 | 1.15× |
| origin (4체) | 400~999 | 원의 자리에 가까워진 자 | 청년의 거짓말 (HP 110) | +10 | 1.30× |
| origin (5체, 최종) | 1000+ | 〃 | **어린 너** (HP 130) | 〃 | 〃 |

각 보스는 시간 역순 — *어린 시절 → 청소년 → 어른 → 청년 → 5~7세 어린 자신*.

---

## 기술 스택

```
client/                     pnpm + Vite + React 18 + TypeScript + TailwindCSS + Zustand
  src/services/llm/         LLMService 인터페이스 + MockLLMService
  src/services/llm/mockData/  분류 룰북, 캐릭터 템플릿 풀, 전투 묘사 풀
  src/screens/              6개 화면 상태머신
  src/components/           StreamingText, StatBar, VoiceBubble, ActionButton

worker/                     Cloudflare Workers + Hono — Phase 1 placeholder (`/api/health`만)

capacitor.config.ts         appId=com.simon.resonance, appName=잔향
```

LLM은 모두 **`MockLLMService`**가 처리한다 (`client/src/services/llm/MockLLMService.ts`). API 키 없이 풀 흐름이 동작한다.

---

## 빠른 시작

```bash
# 저장소 루트에서
pnpm install
pnpm dev          # 5173 포트에서 잔향 PWA — 모바일 사이즈로 보면 가장 좋다
pnpm test         # 닉네임 분류 단위 테스트
pnpm typecheck    # tsc --noEmit
pnpm build        # client/dist 산출물
```

---

## Android APK 빌드

> Android Studio + JDK 17 + Android SDK 34가 로컬에 설치되어 있어야 한다.
> 이 저장소에는 의도적으로 `client/android/`를 커밋하지 않는다 — 처음 한 번 직접 생성한다.

```bash
cd client
pnpm build                              # dist/ 만들기
pnpm exec cap add android               # 1회. client/android/ 가 생성됨
pnpm exec cap sync android              # 매 빌드마다
pnpm exec cap open android              # Android Studio 열림
# 또는 CLI로:
cd android && ./gradlew assembleDebug
# → client/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## End-to-End 검증 (90초 온보딩)

1. `pnpm dev` → 브라우저 5173 (모바일 뷰)
2. **이름을 가진 자** 클릭 → 닉네임 입력 화면 도달 < 5초
3. `엄마` 입력 → A 카테고리 → "그 이름을… 그렇게 부르던 사람이 있었지." 스트리밍
4. `민수` 입력 → H 카테고리 → 일반 캐릭터
5. `어둠` 입력 → D 카테고리 → 자해 키워드 등장하지 않음을 확인
6. **원의 자리로** → 공격 / 대화 / 도망 → 첫 토큰 < 1초, 잊혀진 자 처치 가능
7. 결말 화면 → 누적 잔잔이 `localStorage['resonance:game']`에 저장됨

---

## 디자인 토큰 (v2.2 K-콘텐츠 모던 톤)

`client/src/styles/tokens.css` — 어두운 파스텔 1프리셋:

| 변수 | 값 | 의미 |
|---|---|---|
| `--bg-primary` | `#0F0E14` | 깊은 자정 |
| `--fg-primary` | `#E8E3D5` | 바랜 종이 |
| `--accent-resonance` | `#B89DD0` | 잔향 — 흐릿한 라벤더 |
| `--accent-origin` | `#D4A574` | 원 — 빛 바랜 황금 |

Phase 1+에서 멜랑콜리 / 사이렌의 새벽 2개 프리셋 추가 예정 (v2.4 §28.5).

---

## Phase 1로 넘어갈 때

`MockLLMService` → 실제 LLM 라우터 교체:

1. **API 키 발급**
   - [Anthropic Console](https://console.anthropic.com/) — Haiku 4.5 (캐릭터 생성)
   - [Google AI Studio](https://aistudio.google.com/) — Gemini 2.5 Flash-Lite (분류·전투)
   - 두 곳 모두 카드 결제 한도를 **$30/월**로 설정 (v1.0 §7 Day 1)
2. **Cloudflare**
   - `wrangler login` → AI Gateway 켜기
   - `worker/wrangler.toml`의 D1 / KV / vars 주석을 풀기
   - `wrangler deploy`
3. **클라이언트**
   - `client/src/services/llm/AnthropicHaikuService.ts` 추가 (이 인터페이스를 따른다)
   - `client/src/services/llm/GeminiFlashLiteService.ts` 추가
   - `MockLLMService` import 1줄을 환경 변수로 swap

Phase 1 추가 작업 (기획서 v1.0 §6):
- Capacitor Geolocation (`@capacitor/geolocation`)
- 닉네임 카테고리 B/C/E (Phase 2: F/G)
- 어린시절 보스 1~3체 (이름·성격·대사 차별화)
- 잔잔 누적의 게임 메커니즘 연결 (v2.3)
- Cloudflare Turnstile + 사용자별 rate limit + AI Gateway 예산 캡 (v1.0 §5)

---

## 의도적으로 Phase 0에서 제외한 것

- 실 LLM API 호출
- Cloudflare Workers 배포 (스텁 + /api/health 메타만)
- GPS / 위치 기반 (Phase 0는 8 → 16개 동네 장소 flavor 텍스트로 대체)
- 인증 / 소셜 로그인
- 광고 / 구독 / IAP
- 닉네임 카테고리 C / E / F / G (Phase 0는 A·B·D·H 4종)
- 어린시절 보스 5체 중 3-페이즈 시스템 (Phase 0는 5체 모두 단일 페이즈)
- 길드 / 멀티플레이 / Durable Objects
- Phaser 3 스프라이트 (Phase 0는 텍스트 + CSS 전이만)
- 어린 자신의 3-페이즈 보스전 (숨바꼭질→떼쓰기→마지막 부탁) — Phase 2+

---

## 라이선스 / 워딩

기획서 v1.0 인게임 워딩 사전 준수:

| 한국어 | 영문 |
|---|---|
| 잔향(殘響) | *Resonance* |
| 이름을 가진 자 | *the Named* |
| 목소리 | *the Voice* |
| 잊혀진 자 | *the Forgetter* |
| 4대 키워드 | 희생 · 꿈과현실 · 어린시절 · 추억 |
