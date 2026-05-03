# Setup-Payoff Reference (셋업-페이오프 / 떡밥 회수 시스템)

Read this for any task where setups need to recover reliably — main story planning, multi-quest arcs, or whenever the user emphasizes 떡밥 / 복선. The standard is professional: every setup tracks a payoff, every payoff is rooted, no thread is dropped.

## Contents

- Core Doctrine
- The Setup-Payoff Matrix
- Setup Patterns (with use-cases)
- Misdirection — The Honest Version
- The Three Cardinal Sins
- Special Form: Long Con Foreshadowing
- Worked Example — "The Cracked Teacup"
- Audit Checklist (run before delivering any synopsis)


## Core Doctrine

**Plant → Echo → Payoff.** Three appearances minimum. The middle (echo) deepens or shifts meaning before the third resolves.

**Chekhov's Gun (양방향 적용)**:
- A rifle on the wall in act one *must* fire in act three.
- *Inverse*: do not put a rifle on the wall if you do not intend to fire it.
- The inverse is the harder discipline. It forces every prop, name, and detail to earn its place.

**The reader/player is keeping a quiet ledger.** Every distinctive detail you introduce is logged. Unrecovered details register as either (a) skill failure (the writer forgot) or (b) world texture (acceptable in moderation). Your job is to make almost everything category (a) feel like it would have been category (a) — i.e., recover it.

---

## The Setup-Payoff Matrix

For any project beyond a single scene, maintain an explicit matrix. This is the single most useful tool for ensuring no thread drops.

```
| ID    | Setup (where planted)         | Echo (where deepened)         | Payoff (where recovered)      | Type        | Status |
|-------|-------------------------------|-------------------------------|-------------------------------|-------------|--------|
| SP-01 | Ch.1: 찻잔의 금이 간 자국      | Ch.5: 같은 찻잔 손님에게 줌   | Ch.12: 손님이 돌려줌, 메모 첨부| object      | done   |
| SP-02 | Ch.2: 어머니의 기침            | Ch.6: 약방에 들렀다는 언급    | Ch.14: 어머니의 부고          | health/loss | done   |
| SP-03 | Ch.3: 닫힌 방 언급             | Ch.8: 열쇠를 찾는 장면        | Ch.16: 방을 연다 — 빈 방      | mystery     | done   |
| SP-04 | Ch.1: NPC의 흉터               | Ch.7: 흉터 손으로 가림        | Ch.18: 흉터의 사연 — 주인공과 연결 | character   | done   |
| SP-05 | Ch.4: 마을 노래의 한 소절      | Ch.10: 적군이 같은 노래 흥얼임 | Ch.20: 노래의 출처가 같은 마을 | theme/origin| done   |
```

**Required columns:**
- **ID**: stable handle (SP-01, SP-02...)
- **Setup**: scene/chapter where planted, with one-line description
- **Echo**: scene/chapter where deepened or shifted
- **Payoff**: scene/chapter where recovered, with the *kind* of recovery
- **Type**: object | character | mystery | health/loss | theme/origin | misdirection | promise | name | location
- **Status**: planted | echoed | overdue | recovered | abandoned (tracked actively)

When delivering a synopsis, **always include this matrix with at least 5 entries** for a short arc, more for longer works. If a setup has no planned payoff, mark it `abandoned` with a one-line justification (acceptable: deliberate worldbuilding texture; unacceptable: forgot).

---

## Setup Patterns (with use-cases)

### Pattern 1 — The Innocuous Object
A character notices something small early on. It seems incidental. It is not.
- *Use for*: late-arc emotional payoffs, evidence of a hidden relationship, the proof that completes a mystery.
- *Risk*: too innocuous = forgotten by reader. Mark it with one specific sensory detail (the chip on the rim, the off-color stitching).

### Pattern 2 — The Throwaway Line
A character mentions something — a place, a person, a memory — once, casually. Later it returns as central.
- *Use for*: backstory loads, world reveals, identity reveals.
- *Risk*: too central makes it seem like setup; balance it against other casual mentions.

### Pattern 3 — The Repeated Phrase
A turn of phrase appears in the mouth of one character, then unexpectedly in another's. Or a character's catchphrase shifts in meaning across the arc.
- *Use for*: revealing connections (same teacher, same trauma, secret kinship), thematic resonance.
- *Powerful when*: the second use comes from a character who shouldn't know the phrase.

### Pattern 4 — The Mismatched Detail
Something doesn't fit. The kind grandmother flinches at a particular question. The cheerful merchant won't sell a specific item. The coastal town has no fishing nets.
- *Use for*: long-arc mystery, the seed of a major reveal, the inversion of a first impression.
- *Power*: the player feels the wrongness before they understand it. Trust this.

### Pattern 5 — The Name
A name mentioned in passing returns as a person, place, or revelation.
- *Use for*: lineage reveals, parallel-life setups, "you've been hearing about them all along".
- *Risk*: too many such names produces confusion. Limit to 2–3 per arc and *land* each.

### Pattern 6 — The Choice That Recurs
A specific kind of moral/emotional choice the protagonist faces in chapter 3. They face the same shape of choice in chapter 12 — different stakes, possibly different decision.
- *Use for*: arc demonstration without saying "this is the arc"
- *The classic example*: the protagonist refused to help a stranger early; in the climax, they help someone like that stranger — or pointedly do not.

### Pattern 7 — The Promise Made
A character promises something out loud. Even small promises. The promise *will* be tested.
- *Use for*: oath-driven plots, betrayal arcs, demonstrations of character cost.
- *Rule*: never let a promise pass uncashed. If the promise is broken, that breakage is the payoff.

### Pattern 8 — The Skill Demonstrated
A character casually shows a specific competence — picks a lock, identifies a poison, plays an instrument, knows a dialect. This skill matters later.
- *Use for*: setup for late-game capability, character history reveals.
- *Risk*: feels engineered if the skill demo is too on-the-nose. Bury it in an unrelated scene.

### Pattern 9 — The Gap in the Story
A character pointedly does *not* explain something. A scene cuts before a question is answered. A conversation references "what happened that summer" without clarifying.
- *Use for*: backstory reveals, mystery, the eventual flashback.
- *Rule*: every gap must be filled, or be a deliberately unfillable absence (acceptable for theme).

### Pattern 10 — The Pre-Echoed Image
An image, dream, or vision appears early — its meaning unclear. Later, an actual scene matches the image exactly.
- *Use for*: prophecy, trauma resurfacing, parallel-narrative reveals.
- *Power*: the recognition lands hard if the image is *visually specific* and only reappears once.

---

## Misdirection — The Honest Version

Misdirection is loading a setup *toward the wrong payoff* to hide the true one. **Honest misdirection respects the audience**; cheap twists betray prior setups.

### Honest Misdirection Rules
1. **The clues must, in retrospect, point to the true reveal.** A second read should make the misdirection visible *as misdirection* — not as a cheat.
2. **The wrong payoff must be plausible.** If the reader was led to believe X and X is laughably stupid, the misdirection is contemptuous.
3. **The character's deception should be motivated.** If a character was hiding the truth, *why* — what cost was paid for the lie?

### Cheap Twists to Avoid
- "It was all a dream." (Almost always invalidates the audience's emotional investment.)
- The unprepared villain reveal — a character who has not had any prior weight is suddenly the antagonist.
- The "evil twin" / amnesia / split-personality reveal *without setup* — even with setup, treat with suspicion.
- The reveal that contradicts the character's prior internal monologue when the focalization was established as honest.

### Good Misdirection Examples (study these)
- **The Sixth Sense**: every clue visible, the reread is rewarding.
- **Identity** (Mangold, 2003): structural misdirection that recontextualizes.
- **Outer Wilds**: information appears innocuous, then proves world-shaking — but always trackable backward.
- **Hereditary**: the genre itself is the misdirection.

---

## The Three Cardinal Sins

### Sin 1 — The Dropped Thread
A setup with no payoff. The single most common failure. Audit before delivering: every entry in the matrix has a `Payoff` column filled or a justified `abandoned` mark.

### Sin 2 — The Unplanted Payoff
A reveal that came from nowhere. Equally bad. The emotional weight of a reveal is proportional to how much the audience has been prepared *without realizing they were being prepared*.

### Sin 3 — The Lazy Coincidence
The plot resolves through unrelated luck. Coincidence is acceptable to *cause* problems (start of story); it is forbidden to *resolve* them (end of story). This is Pixar's old rule and it holds across forms.

---

## Special Form: Long Con Foreshadowing

The most satisfying recoveries land 10+ scenes after the plant. To make this work:

1. **Plant in a low-attention moment**: amid action, dialogue, or worldbuilding the audience is processing for surface meaning.
2. **Echo in the middle distance** (5–8 scenes after plant): the echo can be *non-obvious* — a related image, a secondary character mentioning the same name, a similar phrase. The audience does not need to consciously connect; their pattern-recognition is loading.
3. **Recover with explicit reference**: when the payoff lands, *call back* to the plant explicitly enough that the audience says "oh — that was in chapter 1."
4. **Trust your ledger over your memory**: write the matrix entry the moment you plant. Otherwise you will forget.

---

## Worked Example — "The Cracked Teacup"

**Setup (Ch.1, scene 3, low attention)**: Protagonist visits an old friend's home. While the friend prepares tea, the protagonist absently notices a single cup on the shelf is chipped — its rim has a small crescent missing. The friend pours tea into a *different* cup for the protagonist. One line of description; nothing more.

**Echo (Ch.5)**: The friend mentions, in passing, that they've started keeping certain things "for visits that don't happen." The chipped cup is not named.

**Payoff (Ch.12)**: The protagonist returns to the friend's home — there has been a death, or a betrayal, or a long absence. The friend is gone. The shelf is dusty. The chipped cup is missing. On the kitchen counter, the cup sits beside a folded note with the protagonist's name on it. The protagonist understands — too late — *who the chipped cup was always for.*

This works because:
- The setup is one line, low-attention
- The echo is thematic, not literal
- The payoff explicitly returns to the setup *and* recontextualizes the entire friendship
- The reread reveals the chipped cup was the friend's confession, untaken

---

## Audit Checklist (run before delivering any synopsis)

- [ ] Setup-Payoff Matrix exists with ≥5 entries (more for longer works)
- [ ] Every entry has a payoff or a justified `abandoned` mark
- [ ] At least one long-con foreshadow (plant ≥10 scenes before payoff)
- [ ] At least one Pattern 6 (recurring choice) demonstrating arc
- [ ] Misdirection (if any) is honest under reread
- [ ] No unplanted payoffs
- [ ] No coincidence in resolution
- [ ] Final scene calls back to first scene with weight
