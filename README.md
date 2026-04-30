# 잔향 (Resonance) — 프로젝트 문서 패키지

> **이 패키지는 Claude Code가 잔향(殘響, Resonance: Echoes of a Forgotten Self) 프로젝트를 빌드하기 위한 모든 결정사항·세계관·시스템 명세를 담고 있습니다.**

**프로젝트 한 줄 정의**: LLM 기반 GPS 텍스트 MMORPG. 어른이 되며 잘려나간 자기와 한 번도 되어보지 못한 자기를 한 조각씩 만나며, 내 안에 살아 있는 모든 가능성을 다시 그리는 *위로하는 게임*.

---

## 🚨 Claude Code에게 — 가장 먼저 읽을 것

**다음 순서로 읽어주세요. 절대 순서를 바꾸지 마세요:**

1. **`docs/00_START_HERE/PROJECT_SUMMARY.md`** ← *3분 안에 프로젝트 전체를 파악*
2. **`docs/00_START_HERE/READ_ORDER.md`** ← *나머지 11개 문서를 어떤 순서로 읽을지*
3. **`docs/01_CORE_DECISIONS/01_종합정리_v1.2_최신_진실의_원천.md`** ← *진실의 원천. 모든 결정의 토대*

이후는 READ_ORDER.md를 따라가시면 됩니다.

---

## ⚠️ 충돌 해결 규칙

문서 간 결정이 충돌할 때:

```
v1.2 > v1.1 > v1.0 > 세계관 바이블 v0.1 > 캐릭터 도감 v0.2 > v2.4 > v2.3 > v2.2 > v2.1 > v2.0 > v1.0 종합가이드 > 원본 v1
```

**즉**: 종합정리 v1.2가 절대 우선. 아래로 갈수록 *세부 명세*는 살아있되 *철학·톤·메인 주제 결정*에 대해서는 v1.2가 이긴다.

---

## 📁 폴더 구조

```
docs/
├── 00_START_HERE/                ← 이 폴더부터 (필수)
│   ├── PROJECT_SUMMARY.md       (3분 요약)
│   └── READ_ORDER.md            (읽는 순서)
│
├── 01_CORE_DECISIONS/            ← 진실의 원천
│   └── 01_종합정리_v1.2_최신_진실의_원천.md
│
├── 02_WORLDBUILDING/             ← 세계관과 캐릭터
│   ├── 02_세계관바이블_v0.1.md
│   └── 03_캐릭터도감_세계관상세_v0.2.md
│
├── 03_SYSTEM_SPECS/              ← 기술 명세 (구버전 기획서 6개)
│   ├── 01_v1.0_종합가이드_인프라_LLM라우팅.md
│   ├── 02_v2.0_방구석모드_사망_스프린트.md
│   ├── 03_v2.1_추억거점_연령인증_매크로.md
│   ├── 04_v2.2_UI색감_기억의조각_LLM컨텍스트.md
│   ├── 05_v2.3_BOTW진행_엔딩_NPC_기여도.md
│   └── 06_v2.4_닉네임시스템_종합점검.md
│
└── 05_ARCHIVE/                   ← 변천사 (참고용)
    ├── 00_원본_v1_스태미나기반.md
    ├── 05_종합정리_v1.0_변천사.md
    └── 05_종합정리_v1.1_변천사.md
```

---

## 🎯 빌드 시 핵심 원칙 5가지

이건 Claude Code가 잔향의 **5대 영혼**을 코드로 옮길 때 절대 흐려져선 안 되는 것:

1. **메타피직스 갈래 D — 기억의 꿈** (환각·평행세계·데이터 X)
2. **the Voice = 어린 자신의 수호자 자아** (어린 자신 본인 X)
3. **보스 = 모남(잘려나간) + 꿈자국(되어보지 못한) 두 결의 조각** (적 X, 회복 X, 가치 판단 X)
4. **위로하는 게임** (싸구려 위안 X, 훈계 X, 인정 + 동행 O)
5. **미완성의 보존** (간직이 곧 행복. 완성을 향한 게임 X)

---

## 💡 빌드 우선순위 (v2.4에서 결정됨)

**MVP 필수 5가지 — 이것이 안 되면 출시하지 마세요:**

1. LLM 응답 체감 속도 1.5초 (스트리밍 + Flash-Lite 라우팅)
2. 닉네임 카테고리 A·D·H 변환 + 게임 메커니즘 5종
3. 1장 압축(45분) + 90초 튜토리얼 + 어린시절 보스 1~3체
4. 광고+구독+닉네임재생성 IAP 3축 BM
5. 디스코드 + 스토브 인디 + ASO

**Phase 2 (출시 +3개월)**: 닉네임 B·C·E 추가, 보스 5체 완성, 시즌 패스, 5분 세션 모드

**Phase 3 (출시 +6개월)**: Steam 글로벌, 일본어/영어 로컬, 카테고리 F·G, 음성 입력

---

## 📌 의사결정자 (Simon) 연락 필요한 시점

다음 상황에서는 코드를 작성하기 전에 **Simon에게 확인 요청**:

- 5대 영혼 중 하나라도 흔들릴 위험이 있을 때
- 메인 주제 한 문장과 충돌하는 결정이 필요할 때
- v1.2 종합정리에 명시되지 않은 *서사·톤* 영역의 새 결정
- 6엔딩 텍스트에 영향을 미치는 시스템 변경
- 종합 점수 메커니즘 룰 표 가중치 변경

**확인 없이 진행해도 되는 것**:
- 시스템 명세에 이미 박힌 기술 결정 (Cloudflare 스택 등)
- 코드 구조·리팩토링·성능 최적화
- 명세 범위 안에서의 자유로운 구현 디테일

---

## 🔧 기술 스택 (확정됨)

```
Frontend:    Capacitor + React + Vite + TailwindCSS + Phaser 3 (TypeScript)
Backend:     Cloudflare Workers + Hono + Durable Objects(SQLite) + D1 + KV + R2
Auth:        Clerk (10K MAU 무료) + 포트원 본인인증
LLM Routing: AI Gateway 기반 다층
  - Router/Filter:     GPT-5 Nano 또는 Workers AI (무료)
  - General:           Gemini 2.5 Flash-Lite ($0.10/$0.40)
  - Character/Voice:   Claude Haiku 4.5 ($1/$5)
  - Boss/Critical:     Claude Sonnet 4.6 ($3/$15)
  - Ending Image:      Gemini 3.1 Flash Image (Nano Banana Pro) $0.067/장
Tilemap:     Tiled Map Editor + Kenney RPG Urban/Roguelike (CC0)
Bot Block:   Cloudflare Turnstile
Secrets:     Cloudflare Workers Secrets (.env 절대 X)
```

---

## 📊 비용/매출 시뮬레이션 (DAU 1만 기준)

```
월 매출:        ₩1,250만 (광고 ₩1,000만 + 구독 ₩245만 + IAP)
월 LLM 비용:    ₩152만 (매출의 12%)
손익분기:       DAU 3,000부터 1인 생활비 충당
1인 클리어 엔딩: $1.07 (Nano Banana Pro 16장)
```

---

## 📅 12개월 로드맵

```
M-6 ~ M-3:    MVP 알파
M-3 ~ M-1:    CBT 디스코드 시드 200명
M-1 ~ M0:     OBT 스토브 인디 데모
M0:           정식 출시 (한국)
M+1 ~ M+3:    Phase 2 (보스 5체 완성, 시즌 패스)
M+3 ~ M+6:    Phase 3 (Steam 글로벌, 일본어/영어)
M+6 ~ M+12:   1년 평가
```

---

## 🌟 최종 한 마디

> ***"잔향은 — 사회에 맞춰지며 잘려나간 자기와 한 번도 되어보지 못한 자기를, 한 조각씩 다시 만나며, 내 안에 살아 있는 모든 가능성을 다시 그리는 이야기다."***

이 한 문장이 잔향의 모든 결정의 출발점입니다. Claude Code가 어떤 결정에서 막히면 — 이 한 문장에 부합하는지 자문하세요.

---

**문서 패키지 버전**: 2026-04-29
**작성자**: Simon-YHKim + Claude (Anthropic)
**저장소**: github.com/Simon-YHKim/Resonance/tree/Story
