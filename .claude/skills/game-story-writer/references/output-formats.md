# Output Formats Reference (출력 템플릿)

Read when generating a deliverable. Pick the matching template; do not improvise the structure.

---

## Contents

- A. Character Bible — Markdown
- B. Character — JSON (engine import)
- C. Main Story / Synopsis — Markdown
- D. Quest / Sidequest — Markdown
- E. Dialogue / Script — Format
- F. Worldbuilding — Markdown
- When to combine formats


## A. Character Bible — Markdown

```markdown
# 캐릭터: [한글 이름] ([Romanization])

> **한 줄 패러독스:** [예: 가장 다정하기 때문에 가장 잔인할 수 있는 사람]

## 표면 (Surface)
[Profession, public role, what the world sees. 2-3 sentences.]

## 음성 (Voice)
- **리듬:** [controlled / breaking / performing / defensive / sparse / dialect / coded]
- **시그니처 표현:** [signature phrase or verbal tic]
- **회피하는 주제:** [what they refuse to name]
- **샘플 대사:**
  > "[one short paragraph showing the rhythm]"

## 신체 (Body)
- **나이/외형:** [brief — only details that matter for character]
- **버릇:** [one specific gesture, when it appears]
- **흉터/표식:** [a physical mark with a story]
- **공간 점유 방식:** [how they sit, stand, occupy a room]

## 결정적 상처 (Defining Wound)
- **언제:** [time of day, season, year of life]
- **어디서:** [specific place]
- **누구와:** [the other person involved]
- **감각 앵커:** [smell, weather, sound]
- **하지 않은 말:** [the unspoken sentence]

## 자기 정당화 독백 (Self-Justification Monologue)
> "[4–8 sentences in the character's first-person voice, defending their worst choice in their own internal logic. Almost convincing. With cracks where the rationalization fails to fully cover the wound.]"

## 의도된 여백 (Designed Absence)
- **결코 직접 말해지지 않는 사실:** [one specific fact the audience must reconstruct]
- **단서 분포:** [3+ scenes where traces appear, named or numbered]

## 욕망 / 두려움 / 비밀
- **욕망:** [what they would name if asked]
- **두려움:** [what the wound made them fear — usually inverse of want]
- **비밀:** [the never-admitted fact]

## 사물 부적 (Object Talisman)
- **사물:** [the object]
- **의미:** [what it carries]
- **등장 장면:** [3 scenes where it should appear]

## 관계 중력장
- **중력 대상:** [the character whose orbit defines this one]
- **관계의 형태:** [one paradox describing the relationship]

## 등장 메모 (for game integration)
- **첫 등장 권장 위치:** [scene/zone]
- **목소리 톤 디렉션:** [for VO casting if applicable]
- **이 캐릭터를 망치는 방법 (avoid):** [the writing trap specific to this character]
```

---

## B. Character — JSON (engine import)

```json
{
  "type": "character",
  "id": "snake_case_id",
  "name_kr": "한글 이름",
  "name_en": "Romanization",
  "paradox_line": "한 줄 패러독스",
  "surface": {
    "role": "직업/사회적 역할",
    "summary": "2-3 sentence public face"
  },
  "voice": {
    "rhythm": "controlled|breaking|performing|defensive|sparse|dialect|coded",
    "signature_phrase": "시그니처 표현",
    "avoidance": "회피 주제",
    "sample_line": "샘플 대사"
  },
  "body": {
    "appearance": "외형 핵심",
    "habit": "버릇",
    "mark": "흉터/표식",
    "spatial_pattern": "공간 점유 방식"
  },
  "wound": {
    "when": "시점",
    "where": "장소",
    "with_whom": "관련 인물",
    "sensory_anchor": "감각 앵커",
    "unspoken_sentence": "하지 않은 말"
  },
  "self_justification_monologue": "4-8문장 1인칭 정당화 독백",
  "designed_absence": {
    "fact_never_stated": "관객이 결코 직접 듣지 못할 사실",
    "trace_scenes": ["scene_1", "scene_2", "scene_3"]
  },
  "want": "욕망",
  "fear": "두려움",
  "secret": "비밀",
  "talisman": {
    "object": "사물",
    "meaning": "의미",
    "scene_appearances": ["scene_1", "scene_2", "scene_3"]
  },
  "gravity_relationship": {
    "target_id": "other_character_id",
    "shape": "관계의 형태"
  },
  "writing_traps": ["피해야 할 함정 1", "피해야 할 함정 2"]
}
```

---

## C. Main Story / Synopsis — Markdown

```markdown
# [작품명] — 시놉시스

## 테마 한 줄
> [무엇에 대한 이야기인가 — 무슨 일이 일어나는가가 아니라]

## 중심 상처 (Central Wound)
[이 이야기를 가능하게 하는 미해결 상처. 인물의 것이거나 세계의 것.]

## 주요 인물
- **[이름]:** [한 줄 패러독스]
- **[이름]:** [한 줄 패러독스]
- (등 — 핵심 인물만)

## 아크 구조

### 발단
[설정과 일상. 균열의 첫 신호. 내면 변곡점이 시작될 조건.]

### 전개
[관계가 형성되거나 흔들리기 시작. 첫 번째 내면 변곡점.]
- **내면 변곡점 1:** [외부 트리거 → 내면적 비용]

### 위기
[돌이킬 수 없는 지점. 두 번째 변곡점.]
- **내면 변곡점 2:** [외부 트리거 → 내면적 비용]

### 절정
[가장 큰 감정적 충돌. 표면 사건 ≠ 진짜 사건.]
- **내면 변곡점 3:** [외부 트리거 → 내면적 비용]

### 결말
[해결이 아닌 수용. 무엇이 변했고, 무엇은 끝내 변하지 않았는가.]

## 여운의 마지막 장면
[플레이어가 며칠 후에야 의미를 깨닫는 마지막 이미지. 1-2 문단.]

## 의도된 여백 (Designed Absence)
[이 작품이 의도적으로 비워두는 것 — 관객이 스스로 채워야 할 부분. 무엇을 비웠고, 그 여백을 어떻게 활성화하는가. 1 문단.]

## 체화 은유 (Embodied Metaphor)
[중심 추상(트라우마/억압/죄책감/기억 등)이 이 세계에서 어떤 *물리적* 사물·현상의 형태로 나타나는가. "X는 Y와 같다 — Z의 방식으로." 형태의 한 문장.]

## 테마적 무게
[이 이야기가 진짜로 다루는 것 — 표면 줄거리 너머의 질문.]
```

---

## D. Quest / Sidequest — Markdown

```markdown
# 퀘스트: [퀘스트 이름]

## 한 줄 요약
[표면 목표 — 한 문장]

## 진짜 이야기
[감정적 진심 — 표면 목표가 대리하는 것]

## NPC: [이름]
- **부조화 (Incongruity):** [플레이어를 후크하는 어긋남]
- **숨긴 것:** [이 NPC가 말하지 못하는 것]
- **단서 사물:** [환경에 배치된 작은 단서 — 사진 한 장, 식어버린 차 한 잔 등]

## 퀘스트 구조
1. **만남:** [어디서, 어떤 상태로 발견되는가]
2. **요청:** [표면 목표를 어떻게 제시하는가 — 직접 말하지 않는 방식 권장]
3. **여정:** [플레이어가 거치는 단계 — 단순 심부름 금지]
4. **전환점:** [표면 목표가 실은 무엇이었는지 드러나는 순간]
5. **선택:** [최소 3개 — 그중 하나는 "침묵/아무것도 하지 않음" 옵션]
6. **결말:** [선택에 따른 분기 — 모두 보상 ≠ 단순 보상]

## 실패의 서사화 (Failure-as-Content Branches)
- **체크 실패 시:** [실패해도 잠금이 아니라 다른 이야기로 분기 — 비극적, 희극적, 기이한 새 장면]
- **거부/아무것도 안 함 시:** [그 자체로 하나의 결말. 어떤 잔여물을 남기는가]
- **잘못된 정보로 진행 시:** [오해 기반 결말 — NPC와의 관계가 어떻게 비틀리는가]

## 셋업-페이오프 매핑
- **이 퀘스트가 심는 셋업:** [SP-매트릭스의 어느 항목을 plant/echo/payoff하는가 — 최소 1, 권장 3]
- **이전 셋업 회수:** [이 퀘스트에서 회수되는 이전 떡밥]

## 잔여물 (Residue)
[이 퀘스트 후에도 플레이어가 들고 다닐 감정/이미지]

## 월드에 미치는 영향
[다른 퀘스트나 NPC와의 연결고리]
```

---

## E. Dialogue / Script — Format

Use this format for any dialogue heavier than a single exchange:

```
[장면: 시간/장소 — 짧은 분위기 묘사]

[캐릭터 A의 상태/행동]
A: 첫 대사.

B: (행동/시선) 응답.

[침묵 — 길이 표시: 짧게/길게]

A: ...
   ...반말로 전환된 첫 줄.

[B의 미세 반응 — 한 줄로 묘사]

B: (...)  // 말하지 못한 것
B: 다른 화제로 회피하는 대사.

---

[디렉팅 노트:]
- A의 호칭 변화는 이 장면의 핵심 사건. 다음 장면에서 되돌리지 말 것.
- B의 침묵은 두 번 길게, 한 번 짧게.
- 마지막 대사는 컷 직전에 흐르도록.
```

JSON variant for dialogue trees:

```json
{
  "type": "dialogue_tree",
  "id": "scene_id",
  "scene": {
    "location": "장소",
    "time": "시간/계절",
    "atmosphere": "한 줄 분위기"
  },
  "nodes": [
    {
      "id": "n1",
      "speaker": "character_id",
      "line": "대사",
      "stage_direction": "행동/시선/침묵 지시",
      "honorific_register": "formal|informal|shifted",
      "next": ["n2", "n3_choice"]
    }
  ]
}
```

---

## F. Worldbuilding — Markdown

```markdown
# 세계관: [세계 이름]

## 중심 문화 불안 (Central Cultural Anxiety)
[이 사회가 자신에 대해 두려워하는 것 — 한 문장]

## 체화 은유 (Embodied Metaphor)
[이 세계의 중심 추상이 어떤 *물리적* 사물·현상의 형태로 나타나는가. "이 세계에서 [추상명사]는 [구체적 물리현상]이다 — [어떤 방식으로]." 형태의 한 문장. 이 은유가 모든 장면에서 일관되게 작동해야 함.]

## 지명 / 장소

### [장소명] ([어원/원래 이름])
- **위치:** [지리적 좌표 또는 다른 장소와의 관계]
- **역사:** [이름이 바뀐 이유, 또는 두 이름이 공존하는 이유]
- **현재 모습:** [지금 누가 살고, 무엇이 잊혔는가]
- **지리적 심리:** [이 장소는 이야기에서 어떤 심리를 담는가]
- **환경적 스토리텔링:** [이 장소에서 *무슨 일이 있었는가* + *플레이어가 이걸 발견한다는 게 무엇을 의미하는가*]
- **셋업 부하:** [이 장소가 미래의 어느 장면을 위해 심는 떡밥]

## 종족 / 세력

### [종족·세력명]
- **용서하지 못하는 것:** [이들의 정체성을 결정하는 미해결 분노/슬픔]
- **공개적 자기 정체:** [공식 입장]
- **숨긴 자기 정체:** [실제 내부 분열]
- **일상의 디테일:** [먹는 것, 부르는 노래, 잊혀가는 명절]
- **자기 정당화 논리:** [이들이 자신의 가장 부끄러운 행위를 어떻게 정당화하는가 — 한 문장]

## 시대적 균열
[지금 이 세계에서 일어나는 변화 — 누가 이기고 있고, 누가 잊히고 있는가]

## 플레이어가 마주칠 첫 인상
[게임 시작 시 플레이어가 세계에 대해 받는 첫 감각적 인상 — 시각/청각/후각]

## 의도된 여백 (Designed Absence)
[이 세계관에서 플레이어가 끝까지 *직접 알 수 없게* 두는 것 — 그러나 단편들로 재구성 가능해야 함. 무엇을 비웠고, 어디에 단서를 분산시키는가.]

## 작가만 아는 로어 (Hidden Lore — Writer's-Only)
[Souls-like 전달 방식의 경우, 플레이어가 직접 보지 못하는 내부 로어. 단편 대 로어 비율 1:5 권장. 5장 분량의 이 섹션이 1장 분량의 단서를 지탱한다.]
```

---

## When to combine formats

- **Character + scene:** Markdown character sheet, then a sample dialogue scene below it. Lets the user feel the voice, not just read about it.
- **World + characters:** World gazetteer first, then 2–3 character sheets that exemplify the world's central anxiety in different ways.
- **Synopsis + JSON:** Markdown synopsis for human reading; appended JSON block of structured character/quest IDs for engine import.

Default to markdown unless the user signals engine integration. When in doubt, ask once.
