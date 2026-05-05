# 잔향(Resonance) — Claude Code 컨텍스트 카드

> **Claude Code가 매 세션 시작 시 자동 로드하는 컨텍스트 시드.**
> 이 문서는 *최대 1,500 토큰* 안에 잔향의 모든 핵심을 압축합니다.
> 파일 경로 권장: `.claude/CLAUDE_CODE_CONTEXT.md` 또는 `docs/CONTEXT.md`

---

## 누가·무엇·왜

```
WHO: Simon-YHKim (LG Innotek 엔지니어, 1인 게임 제작자)
     한국어 응답. timestamp + token usage 표시 필수.
     솔직한 진단 선호.

WHAT: 잔향(Resonance) — LLM 기반 GPS 텍스트 게임
      산나비 톤 8~12시간 메인 + 무한 사이드
      픽셀아트 (32x32~256x256)
      6엔딩 (동행/작별 × 개화/여전/항로)

WHY: "맞춰가며 살아온 시간이 길어서 — 한 번도 되어본 적 없는 내가, 
      그 시간만큼 자랐다." (the Named의 한 줄 패러독스)
      위로하는 게임. 폭력·경쟁 X.
```

---

## 5대 영혼 (절대 흐려선 안 됨)

```
1. 메타피직스 갈래 D — 잠들기 직전 30분의 게임
2. the Voice = 어린 자신의 수호자 자아 (4단계 정체 공개)
3. 보스 = 모남(잘려나간) + 꿈자국(되어보지 못한) 조각
4. 위로하는 게임 — 인정 + 동행, 판단·경쟁·폭력 X
5. 미완성의 보존 — 간직이 곧 행복 (박준형 정수)
```

---

## 5체 보스 (시간 역행)

```
1. 남겨진 거인 (30~40대 직장)
2. 흐르는 그림자 (20대 사랑)
3. 미루는 학자 (17~19세 꿈)
4. 떠난 친구들 (8~12세 우정) ← 결정적 변곡점 (점수 우세 축 결정)
5. 원의 아이 (5~7세 첫 자기) ← 종장
```

---

## 핵심 시스템 (시스템 명세 v1.4)

```
[D1 테이블 8개]
user_wiki, user_modaem_collection, user_skill_tree, user_macro,
street_mob_cache, hex_metadata, llm_usage_log, violation_log

[모남 조각 = 11카테고리 스킬 트리 + WoW 매크로]
점심·결정장애 / 출퇴근 / 카공 / 회식 / 야근 / 운동 /
만남 / 학습 / 쇼핑 / 가족 / 늦은밤·불면
× 4Tier = 44스킬

[닉네임 → 유동 컨텍스트]
LLM이 닉네임에서 직업·환경·정서 추론 → JSON 영구 기억

[6엔딩]
첫: 동행/작별 × 두번째: 개화/여전/항로
```

---

## 인게임 워딩 사전 (절대 변경 X)

```
잔향(殘響) / 원 / 원의 자리 /
이름을 가진 사람 (the Named) / 목소리 (the Voice) /
잊혀진 자 (the Forgetter) / 모남 조각 (대/소) /
꿈자국 조각 / 잔잔(殘殘) / 사라짐 (게임 사망) /
건너기 (헥스 이동) / 남은 자리 (추억 거점)
```

---

## 기술 스택

```
Frontend: React Native + TypeScript (Expo)
Backend: Cloudflare Workers + D1 + KV + R2
LLM: Claude Haiku 4.5 (free) / Sonnet 4.6 (premium) / Gemini Flash-Lite (fallback)
Auth: Clerk
Payment: 포트원 (한국) + Apple/Google IAP
Hex: H3 Resolution 9
CI/CD: GitHub Actions + Cloudflare Pages
Monitoring: MS Clarity + Google Analytics + Sentry
```

---

## 절대 룰

```
✅ 한국어 응답
✅ 답변 끝 [YY.MM.DD/HH.MM.SS] + [토큰] 표시
✅ Conventional Commits (feat:, fix:, chore:...)
✅ TDD — 테스트 작성 후 push
✅ .env 시크릿 검증 (하드코딩 X)
✅ 파괴적 작업 사용자 확인 (DB 삭제, force push 등)
✅ 매 변경 후 README + Swagger 업데이트

❌ 영혼 4번 위배 (폭력·경쟁·자기학대 메커니즘)
❌ 인게임 워딩 변경
❌ 사용자 모르게 진행
```

---

## 빌드 진행률

```
기획·스토리: ████████████████████ 100% ✅
비주얼 시스템: ████████████████████ 100% ✅ (ComfyUI turn-key)
코드 빌드:   ████████░░░░░░░░░░░░  40% 🔧 ← Phase 1 진행 중
실제 자산:   ░░░░░░░░░░░░░░░░░░░░   0% (Simon ComfyUI 셋업 후)
알파:        ░░░░░░░░░░░░░░░░░░░░   0%
정식 출시:   ░░░░░░░░░░░░░░░░░░░░   0% (목표: 2026.11)
```

---

## 막히면 — Simon에게 옵션 A/B/C 제시 형식

```
🔴 결정 필요: [상황 한 줄]

옵션 A: [장단점]
옵션 B: [장단점]
옵션 C: [장단점]

내 추천: [옵션 X 이유]
```

---

## 참조 문서 (필요 시 로드)

```
README_FOR_CLAUDE_CODE.md — 인계 패키지 (가장 중요)
PHASE1_BUILD_PROMPT.md — 현재 빌드 명령
잔향_시스템명세_v1.4.md — D1 + API 명세
잔향_종합정리_v1.3_14가지피드백통합.md — 최신 결정문
잔향_캐릭터자기정당화모놀로그_v1.0.md — LLM 컨텍스트 시드
잔향_완성형메인스토리_v1.0_산나비톤.md — 시나리오
```

---

> ***"잔향이 — 잠시, 머물렀어요."***
> *(매 세션 끝에 이 문장으로 마무리하면 — 잔향 영혼이 보호됨)*
