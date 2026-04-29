# Changelog

잔향(Resonance) 변경 이력. Phase 0 검증 프로토타입 단계의 누적 변경.

> 형식 — [Keep a Changelog](https://keepachangelog.com/) (한국어 변형).
> 버전은 Phase 0 단계에서는 PR 번호로만 추적, Phase 1 진입 시 SemVer 시작.

---

## [Unreleased] — Phase 0 게임 경험 강화 sprint

이번 sprint는 핵심 게임 루프(닉네임 → 캐릭터 → 전투 → 결말 → 누적)를 강화하는 데 집중했다. 외부 API·인증·결제는 의도적으로 제외.

### 게임 콘텐츠 (보스·메커니즘)

- **5체 잊혀진 자 완성** — 5체 모두 단일 페이즈 archetype (#16, #20, #31)
  - 어린 시절의 잔해 → 청소년의 침묵 → 어른의 가면 → 청년의 거짓말 → **어린 너 (최종, 잔잔 1000+)**
  - 시간 역순 BOTW 진행 철학 (v2.3 §28.2)
- **tier 액션 보정** — 잔잔 누적이 실제 게임 효과 (#22)
  - dialogue 잔잔 보너스 +0 / +3 / +6 / +10
  - attack 데미지 1.0× / 1.0× / 1.15× / 1.30×

### UX·결말·재방문 동기

- **카테고리별 결말 footer** — 4 카테고리 × 4 결말 = 16 variants (#21)
- **tier 승급 햅틱 + 라벤더 펄스** — 승급 순간 강조 (#25)
- **+N 잔잔 + 승급 알림** — 결말 화면 보상 즉시 체감 (#24)
- **결말 → 캐릭터 시트 동선** — "나의 잔향" 버튼 (#27)
- **타이틀 캐릭터 미리보기** — 마지막 닉네임/호칭 + "잔향의 자리로" 직행 (#28)
- **캐릭터 시트 기록 섹션** — 분류 / 만남수 / 생성일 (#29)

### 정체성·콘텐츠

- **장소 flavor 8종** — 동네가 던전이 된다 (#23)
- **장소 풀 16종 확장** — 한국 도시 디테일 (#26)

### 입력·통제권

- **닉네임 입력 hint** — 공백만 안내 (#33)
- **reset 옵션** — 두 단계 confirm으로 잔향 전체 초기화 (#33)

### 안정성·배포

- **테스트 21 → 64+** — gameStore / mock LLM / 5체 / 카테고리 / 장소 (#17, #21, #26, #29, #31)
- **햅틱 패턴** — tap/soft/firm/promotion (#18, #25)
- **PWA 강화** — display_override · shortcuts · OG 메타 (#32)
- **Worker /api/health 메타** — phase / endpoints / safety policy (#30)

### 마케팅·운영

- **Discord 시드 + ASO 자산** — 친구 50 디코 시드 준비 (#19)
- **README + CHANGELOG sync** — Phase 0 기능 명세 갱신 (#34)

---

## 누적 잔잔 시스템 (이 sprint 기준)

| Tier | 잔잔 임계 | 호칭 | 보스 | HP |
|---|---|---|---|---|
| novice | 0 | 처음 온 자 | 어린 시절의 잔해 | 60 |
| echo | 50 | 잔향이 머무는 자 | 청소년의 침묵 | 75 |
| resonant | 150 | 잔향과 함께 걷는 자 | 어른의 가면 | 95 |
| origin (4체) | 400 | 원의 자리에 가까워진 자 | 청년의 거짓말 | 110 |
| origin (5체, 최종) | 1000 | 〃 | 어린 너 | 130 |

---

## Phase 1 진입 게이트 (다음 sprint)

1. Anthropic / Google API 키 발급 + `wrangler secret put`
2. Cloudflare AI Gateway + budget cap $30/월 설정
3. `MockLLMService` → `AnthropicHaikuService` + `GeminiFlashLiteService` swap
4. Capacitor Geolocation 추가 + GPS 동의 모달
5. 디스코드 50 시드 CBT 시작 — D1 retention ≥ 35% 측정
