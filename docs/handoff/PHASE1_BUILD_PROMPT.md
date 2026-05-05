# PHASE 1 — Claude Code 빌드 명령 (D1 + 닉네임 분석 + Wiki)

> **이 프롬프트를 Claude Code에게 그대로 던지세요.**
> 작성: 2026-05-05 / Phase 1 인계
> 예상 작업 기간: 1주 (Day 1~7)

---

## 0. Simon이 Claude Code에게 던질 메시지 (복사 권장)

```
잔향(Resonance) Phase 1 빌드를 시작해. 다음 절차 정확히 따라줘:

1. 먼저 README_FOR_CLAUDE_CODE.md를 읽고 잔향 컨텍스트 100% 흡수해.

2. 그 다음 PHASE1_BUILD_PROMPT.md (이 문서) 전체를 읽고 작업 계획을 짜.

3. 작업 계획을 나에게 한 페이지 요약으로 보고해 — 시작하지 말고.

4. 내가 "진행해" 한 후에만 빌드 시작.

5. 매 작업 단계마다:
   - Conventional Commits 준수
   - 단위 테스트 작성 후 push
   - .env 시크릿 검증
   - README + Swagger 자동 업데이트

GitHub repo: https://github.com/Simon-YHKim/Resonance
브랜치: claude/react-native-game-app-D4IwM

작업 중 막히는 부분이나 결정 필요한 부분은 즉시 나에게 옵션 A/B/C 제시해.
한국어 응답 + timestamp/token 표시 잊지 마.

시작 전 — 작업 계획 먼저 보고해.
```

---

## 1. Phase 1 작업 범위 — 한 페이지 요약

### 1.1 핵심 산출물 5개

```
[1] D1 테이블 8개 추가 (스키마 + 마이그레이션)
[2] 닉네임 분석 LLM API (POST /api/character/analyze)
[3] user_wiki 컨텍스트 주입 미들웨어
[4] 단위 테스트 (목표 커버리지 80%+)
[5] README + OpenAPI 자동 업데이트
```

### 1.2 영향 범위

```
✅ 추가: 8개 D1 테이블, 1개 API 엔드포인트, 1개 미들웨어, 테스트 파일
✅ 수정: README.md, openapi.yaml, .env.example
❌ 변경 금지: 기존 인증·결제·헥스 시스템 코드
```

### 1.3 의존성

```
[새로 필요한 패키지]
@anthropic-ai/sdk (또는 OpenAI SDK if Gemini 라우팅)
zod (타입 검증)
vitest (테스트)
@cloudflare/workers-types

[새로 필요한 환경변수]
ANTHROPIC_API_KEY
GEMINI_API_KEY (Flash-Lite 라우팅용)
JANSAE_LLM_PRIMARY_MODEL=claude-haiku-4-5
JANSAE_LLM_FALLBACK_MODEL=gemini-flash-lite
```

---

## 2. 작업 단계 — Day 1~7 상세

### Day 1 — D1 스키마 설계 + 마이그레이션 작성

**목표**: 8개 테이블의 SQL 마이그레이션 파일 생성 + 로컬 DB에 적용

#### 작업 항목

```
1. worker/migrations/ 폴더 생성
2. 다음 마이그레이션 파일 작성:
   - 0001_user_wiki.sql
   - 0002_user_modaem_collection.sql
   - 0003_user_skill_tree.sql
   - 0004_user_macro.sql
   - 0005_street_mob_cache.sql
   - 0006_hex_metadata.sql
   - 0007_llm_usage_log.sql
   - 0008_violation_log.sql
3. 각 마이그레이션마다 .down.sql (롤백) 같이 작성
4. wrangler d1 migrations apply (로컬)로 검증
5. 인덱스 추가 (성능)
```

#### 스키마 명세 (시스템 명세 v1.4 §1.1, §2.2, §4.1, §4.2, §5.1 그대로)

**user_wiki**:
```sql
CREATE TABLE user_wiki (
  user_id TEXT PRIMARY KEY,
  nickname_analysis_json TEXT NOT NULL,
  speech_pattern_json TEXT,
  frequent_words TEXT,
  milestones_json TEXT,
  gaehwa_axis INTEGER NOT NULL DEFAULT 0,
  yeojeon_axis INTEGER NOT NULL DEFAULT 0,
  hangno_axis INTEGER NOT NULL DEFAULT 0,
  axis_locked_at INTEGER,
  context_change_log_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**user_modaem_collection**:
```sql
CREATE TABLE user_modaem_collection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  modaem_text TEXT NOT NULL,
  category TEXT NOT NULL,
  size TEXT NOT NULL CHECK(size IN ('small', 'large')),
  source_type TEXT NOT NULL CHECK(source_type IN ('street_mob', 'boss', 'mini_event')),
  source_id TEXT,
  acquired_at INTEGER NOT NULL,
  childhood_memory TEXT,
  hex_id TEXT,
  context_snapshot_json TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_modaem_user_category ON user_modaem_collection(user_id, category);
CREATE INDEX idx_modaem_user_acquired ON user_modaem_collection(user_id, acquired_at DESC);
```

**나머지 6개 테이블**: 시스템 명세 v1.4 §1.1.2~§5.1.2 그대로 따라 작성.

#### 검증

```bash
# 로컬 D1에 마이그레이션 적용
wrangler d1 execute jansae-db --local --file=migrations/0001_user_wiki.sql
# ... 0008까지 반복

# 또는 자동 적용
wrangler d1 migrations apply jansae-db --local

# 테이블 확인
wrangler d1 execute jansae-db --local --command="SELECT name FROM sqlite_master WHERE type='table'"
```

#### 산출물

```
worker/migrations/0001_user_wiki.sql (+ .down.sql)
worker/migrations/0002_user_modaem_collection.sql
worker/migrations/0003_user_skill_tree.sql
worker/migrations/0004_user_macro.sql
worker/migrations/0005_street_mob_cache.sql
worker/migrations/0006_hex_metadata.sql
worker/migrations/0007_llm_usage_log.sql
worker/migrations/0008_violation_log.sql
worker/migrations/README.md (마이그레이션 가이드)
```

#### Commit 메시지

```
feat(db): add 8 D1 tables for jansae v1.3 systems

- user_wiki: 사용자별 영구 컨텍스트 저장
- user_modaem_collection: 모남 조각 영구 컬렉션
- user_skill_tree: 11카테고리 스킬 트리 진행도
- user_macro: WoW 매크로 등록
- street_mob_cache: 헥스별 LLM 생성 몹 캐시
- hex_metadata: 인구밀도·신호 강도
- llm_usage_log: 토큰 사용량 측정
- violation_log: 안전 위반 로그

Refs: 잔향_시스템명세_v1.4.md §1.1, §2.2, §4.1, §5.1
```

---

### Day 2 — 닉네임 분석 LLM API 빌드

**목표**: POST /api/character/analyze 엔드포인트 + LLM 호출 + JSON 파싱

#### 작업 항목

```
1. worker/src/routes/character.ts 생성
2. POST /api/character/analyze 엔드포인트
3. LLM 호출 함수 (Claude Haiku 4.5 또는 Gemini Flash-Lite)
4. JSON 응답 파싱 + 검증 (Zod)
5. user_wiki 테이블에 저장
6. 에러 처리 (LLM 실패 시 fallback)
```

#### API 명세

**Request**:
```http
POST /api/character/analyze
Content-Type: application/json
Authorization: Bearer {clerk_jwt}

{
  "nickname": "회사다니기싫은김대리"
}
```

**Response (200)**:
```json
{
  "success": true,
  "user_wiki": {
    "user_id": "user_xxx",
    "nickname_analysis": {
      "nickname": "회사다니기싫은김대리",
      "category": "D",
      "추정직업": "직장인",
      "추정연령": "30대",
      "추정환경": "사무실",
      "정서적결": "지친",
      "주요키워드": ["회사", "직장인", "김대리", "출근", "회의실"],
      "스토리매칭": {
        "보스1자리": "강남역 출근길",
        "보스1회상": "회식 자리",
        "보스2자리": "한강 둔치",
        "보스3자리": "고시원 또는 사내 휴게실",
        "보스4자리": "초등학교 골목",
        "보스5자리": "회색 운동장 (공통)"
      },
      "거점NPC말투": {
        "차분한가게주인": "수고했어요. 김 대리님."
      },
      "the_Voice_호칭": "김 대리님"
    }
  }
}
```

**Response (400)**:
```json
{
  "success": false,
  "error": "닉네임은 1~20자 한글/영문/숫자만 허용됩니다.",
  "code": "INVALID_NICKNAME"
}
```

**Response (500)**:
```json
{
  "success": false,
  "error": "LLM 호출 실패. 잠시 후 다시 시도해주세요.",
  "code": "LLM_ERROR"
}
```

#### LLM 시스템 프롬프트

시스템 명세 v1.4 §2.1.1 그대로:

```
당신은 게임 *잔향(Resonance)*의 닉네임 분석가입니다.
사용자가 입력한 닉네임에서 다음을 추론해주세요:

1. 직업·신분 (직장인/대학생/대학원생/주부/은퇴자/프리랜서/학생/기타)
2. 추정 연령대 (10대/20대/30대/40대/50대+)
3. 추정 환경 (사무실/캠퍼스/연구실/집·동네/공방/기타)
4. 정서적 결 (지친/평이한/희망적/슬픈/장난스러운/외로운/그리운)
5. 닉네임 카테고리 (A: 가족 호칭 / B: 보편 한국 이름 / C: 실명 변형 / 
   D: 위험 단어 / E: 욕설 / F: 정치인·종교 / G: 타 IP / H: 안전 다양)

출력은 반드시 JSON 형식으로:
{ ... 위 응답 형식 그대로 ... }
```

#### Zod 검증 스키마

```typescript
import { z } from 'zod';

export const NicknameAnalysisSchema = z.object({
  nickname: z.string().min(1).max(20),
  category: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']),
  추정직업: z.string(),
  추정연령: z.string(),
  추정환경: z.string(),
  정서적결: z.string(),
  주요키워드: z.array(z.string()).max(10),
  스토리매칭: z.object({
    보스1자리: z.string(),
    보스1회상: z.string(),
    보스2자리: z.string(),
    보스3자리: z.string(),
    보스4자리: z.string(),
    보스5자리: z.string(),
  }),
  거점NPC말투: z.record(z.string()),
  the_Voice_호칭: z.string(),
});
```

#### 단위 테스트 (Vitest)

```typescript
// worker/src/routes/__tests__/character.test.ts

import { describe, it, expect } from 'vitest';
import { analyzeNickname } from '../character';

describe('POST /api/character/analyze', () => {
  it('should analyze 직장인 nickname correctly', async () => {
    const result = await analyzeNickname('회사다니기싫은김대리');
    expect(result.category).toBe('D');
    expect(result.추정직업).toBe('직장인');
    expect(result.스토리매칭.보스1자리).toContain('강남');
  });

  it('should reject empty nickname', async () => {
    await expect(analyzeNickname('')).rejects.toThrow('INVALID_NICKNAME');
  });

  it('should reject nickname over 20 chars', async () => {
    await expect(analyzeNickname('a'.repeat(21))).rejects.toThrow('INVALID_NICKNAME');
  });

  it('should handle LLM failure with fallback', async () => {
    // Mock LLM 실패
    const result = await analyzeNickname('일반사용자', { mockFail: true });
    expect(result.category).toBe('H'); // fallback 카테고리
  });
});
```

#### Commit 메시지

```
feat(api): add nickname analysis endpoint

POST /api/character/analyze accepts a nickname (1-20 chars) and returns
a structured user_wiki entry with story matching, speech patterns, and
the_Voice 호칭.

- Uses Claude Haiku 4.5 (fallback: Gemini Flash-Lite)
- Validates with Zod (NicknameAnalysisSchema)
- Stores result in user_wiki table
- Token usage logged to llm_usage_log
- Unit tests with 95% coverage

Refs: 잔향_시스템명세_v1.4.md §2.1, §2.2
```

---

### Day 3 — user_wiki 컨텍스트 주입 미들웨어

**목표**: 모든 LLM 호출 시 user_wiki를 자동 컨텍스트에 주입

#### 작업 항목

```
1. worker/src/middleware/wiki-injection.ts 생성
2. 미들웨어 함수: requireUserWiki()
3. LLM 호출 헬퍼 함수: callLLMWithWiki(userId, prompt, options)
4. 토큰 사용량 자동 로깅 (llm_usage_log)
```

#### 미들웨어 코드 시안

```typescript
// worker/src/middleware/wiki-injection.ts

import { Context } from 'hono';
import { Bindings } from '../types';

export interface UserWikiContext {
  user_id: string;
  nickname: string;
  category: string;
  추정직업: string;
  추정연령: string;
  주요키워드: string[];
  the_Voice_호칭: string;
  recent_milestones: any[];
  dominant_axis: 'gaehwa' | 'yeojeon' | 'hangno' | null;
}

export async function getUserWikiContext(
  db: D1Database,
  userId: string
): Promise<UserWikiContext | null> {
  const result = await db
    .prepare('SELECT * FROM user_wiki WHERE user_id = ?')
    .bind(userId)
    .first();
  
  if (!result) return null;
  
  const analysis = JSON.parse(result.nickname_analysis_json as string);
  const milestones = result.milestones_json 
    ? JSON.parse(result.milestones_json as string) 
    : [];
  
  // 우세 축 결정
  let dominant_axis: 'gaehwa' | 'yeojeon' | 'hangno' | null = null;
  if (result.axis_locked_at) {
    const max = Math.max(
      result.gaehwa_axis as number,
      result.yeojeon_axis as number,
      result.hangno_axis as number
    );
    if (max === result.gaehwa_axis) dominant_axis = 'gaehwa';
    else if (max === result.yeojeon_axis) dominant_axis = 'yeojeon';
    else dominant_axis = 'hangno';
  }
  
  return {
    user_id: userId,
    nickname: analysis.nickname,
    category: analysis.category,
    추정직업: analysis.추정직업,
    추정연령: analysis.추정연령,
    주요키워드: analysis.주요키워드,
    the_Voice_호칭: analysis.the_Voice_호칭,
    recent_milestones: milestones.slice(-3),
    dominant_axis,
  };
}

export function buildSystemPromptWithWiki(
  wiki: UserWikiContext,
  basePrompt: string
): string {
  return `${basePrompt}

[사용자 컨텍스트 — 자동 주입]
닉네임: ${wiki.nickname}
직업: ${wiki.추정직업}
연령: ${wiki.추정연령}
주요키워드: ${wiki.주요키워드.join(', ')}
the Voice 호칭: ${wiki.the_Voice_호칭}

[최근 이정표]
${wiki.recent_milestones.map(m => `- ${m.event}`).join('\n')}

${wiki.dominant_axis ? `[우세 축] ${wiki.dominant_axis}` : ''}

위 컨텍스트에 부합하는 한국어 응답을 작성하시오.`;
}
```

#### LLM 호출 헬퍼

```typescript
// worker/src/lib/llm.ts

import Anthropic from '@anthropic-ai/sdk';

interface LLMCallOptions {
  model?: 'haiku-4.5' | 'sonnet-4.6' | 'flash-lite';
  context: 'battle' | 'story' | 'character_gen' | 'ending' | 'macro';
  user_id: string;
  is_premium: boolean;
}

export async function callLLMWithWiki(
  env: Bindings,
  userMessage: string,
  systemPrompt: string,
  options: LLMCallOptions
): Promise<{ response: string; tokens_used: number; cost_usd: number }> {
  const wiki = await getUserWikiContext(env.DB, options.user_id);
  if (!wiki) throw new Error('user_wiki not found. Run /api/character/analyze first.');
  
  const fullSystemPrompt = buildSystemPromptWithWiki(wiki, systemPrompt);
  
  // 모델 라우팅 (비용 최적화)
  const model = options.model || (options.is_premium ? 'sonnet-4.6' : 'haiku-4.5');
  
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: getModelString(model),
    max_tokens: 1024,
    system: fullSystemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  
  const responseText = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';
  
  // 토큰 사용량 로깅
  await logLLMUsage(env.DB, {
    user_id: options.user_id,
    llm_model: model,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    cost_usd: calculateCost(model, response.usage),
    context: options.context,
    is_premium: options.is_premium,
  });
  
  return {
    response: responseText,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    cost_usd: calculateCost(model, response.usage),
  };
}
```

#### Commit 메시지

```
feat(middleware): add user_wiki context injection for LLM calls

callLLMWithWiki() now automatically:
- Fetches user_wiki from DB
- Builds system prompt with user context
- Routes to appropriate model (haiku for free, sonnet for premium)
- Logs token usage to llm_usage_log

Refs: 잔향_시스템명세_v1.4.md §2.3
```

---

### Day 4 — 통합 테스트 + E2E 시나리오

**목표**: Phase 1 시스템 통합 검증

#### 테스트 시나리오

```
시나리오 1: 신규 사용자 가입 → 닉네임 분석 → user_wiki 생성
1. POST /api/auth/signup
2. POST /api/character/analyze {nickname: "회사다니기싫은김대리"}
3. GET /api/user/wiki → 200 OK + user_wiki 데이터

시나리오 2: 사용자 컨텍스트 주입 LLM 호출
1. user_wiki가 있는 사용자
2. callLLMWithWiki() 호출
3. 응답이 사용자 컨텍스트 반영 확인 (예: 김 대리님 호칭)

시나리오 3: 닉네임 분석 실패 → fallback
1. LLM 실패 mock
2. 호출
3. 카테고리 H (안전 다양) fallback 확인

시나리오 4: 토큰 사용량 측정
1. LLM 호출 5회
2. SELECT * FROM llm_usage_log → 5개 행 확인
3. cost_usd 합계가 예상 범위 내 확인
```

#### Commit 메시지

```
test(integration): add Phase 1 E2E test scenarios

- Signup → analyze → wiki retrieval
- Wiki injection in LLM calls
- Fallback behavior on LLM failure
- Token usage tracking accuracy

Coverage: 87% (target 80%+)
```

---

### Day 5 — 보안·성능 검증

**목표**: Phase 1 코드의 보안·성능 점검

#### 작업 항목

```
1. 시크릿 검증 — 모든 코드에서 ANTHROPIC_API_KEY 등 하드코딩 X 확인
2. .env.example 업데이트
3. .gitignore 확인 (.env 포함)
4. SQL injection 방어 (D1 prepare 사용 확인)
5. Rate limiting 추가 (POST /api/character/analyze는 회원당 1회/시간)
6. Cloudflare Workers 성능 측정
   - 닉네임 분석: < 3초
   - LLM 호출: < 1.5초 (영혼급 빌드 조건)
```

#### Commit 메시지

```
security(phase1): add secret validation, rate limiting, perf checks

- Verified no hardcoded secrets in codebase
- Updated .env.example with all required vars
- Added rate limiting to /api/character/analyze (1/hour/user)
- Verified D1 prepared statements (SQL injection safe)
- Performance: avg LLM call 1.2s (target <1.5s) ✅
```

---

### Day 6 — README + Swagger 자동 업데이트

**목표**: 모든 변경사항을 문서화

#### 작업 항목

```
1. README.md 업데이트
   - Phase 1 추가 시스템 설명
   - .env 변수 목록
   - 테스트 실행 방법
   - 마이그레이션 가이드
   
2. openapi.yaml (또는 OpenAPI 자동 생성 도구)
   - POST /api/character/analyze 명세
   - GET /api/user/wiki 명세 (조회용)
   
3. CHANGELOG.md 업데이트
   ## [Phase 1] - 2026-05-XX
   ### Added
   - 8 D1 tables (user_wiki, user_modaem_collection, etc.)
   - POST /api/character/analyze
   - user_wiki context injection middleware
   - Token usage tracking
   - Rate limiting
```

#### Commit 메시지

```
docs(phase1): update README, OpenAPI, CHANGELOG

- README: Phase 1 systems documented
- OpenAPI: 2 new endpoints documented
- CHANGELOG: Phase 1 entry added
```

---

### Day 7 — 알파 빌드 + Simon 검토

**목표**: Phase 1 완성 + Simon에게 데모

#### 작업 항목

```
1. 모든 변경사항 squash → 1 PR
2. PR 설명 템플릿 작성 (자동 생성):
   ## 변경사항
   - 8 D1 테이블 추가
   - 닉네임 분석 LLM API
   - user_wiki 컨텍스트 주입
   
   ## 테스트
   - Vitest: 47 passed, coverage 87%
   - E2E: 4 시나리오 통과
   
   ## 리뷰 포인트
   - LLM 모델 라우팅 로직
   - Rate limiting 임계값 (1/hour 적절?)
   
   ## 다음 단계 (Phase 2)
   - 모남 스킬 트리 + WoW 매크로

3. Simon 검토 요청 + Slack/이메일 알림
```

---

## 3. Phase 1 완료 기준 (DoD)

다음 모든 항목이 ✅이면 Phase 1 완료:

```
[코드]
[ ] 8개 D1 테이블 마이그레이션 완료
[ ] POST /api/character/analyze 작동
[ ] user_wiki 미들웨어 작동
[ ] LLM 호출 시 자동 컨텍스트 주입
[ ] 토큰 사용량 자동 로깅

[테스트]
[ ] 단위 테스트 커버리지 ≥ 80%
[ ] 4개 E2E 시나리오 통과
[ ] LLM 호출 평균 응답 < 1.5초

[보안]
[ ] 시크릿 하드코딩 없음 (검증 완료)
[ ] .env.example 최신
[ ] Rate limiting 적용
[ ] SQL injection 방어 확인

[문서]
[ ] README 업데이트
[ ] OpenAPI 업데이트
[ ] CHANGELOG 업데이트
[ ] 마이그레이션 가이드 작성

[배포]
[ ] git push origin claude/react-native-game-app-D4IwM
[ ] PR 생성 + 설명 작성
[ ] Simon 검토 요청 알림
```

---

## 4. Phase 2~5 미리보기 (Phase 1 완료 후)

```
[Phase 2 — 2주차] 모남 스킬 트리 + WoW 매크로
- 11카테고리 × 4Tier × 44스킬 정의
- 매크로 등록 시스템 UI + API
- 스킬 사용 LLM 호출

[Phase 3 — 3주차] 길거리 몹 LLM + 11카테고리 자유 변주
- POST /api/mob/generate
- 캐싱 시스템 (street_mob_cache)
- 행동 10변주 풀

[Phase 4 — 4주차] 인구밀도 + 안전 시스템
- KOSIS 인구밀도 데이터 통합
- 미성년자 검열 LLM 사전 분류
- 위반 누적 페널티

[Phase 5 — 5주차] 통합 테스트 + 알파 빌드
- 전체 시스템 E2E 테스트
- 알파 빌드 패키징
- 디스코드 CBT 200명 모집 시작
```

---

## 5. 작업 중 막히면 — Simon에게 보고할 형식

```
[옵션 A/B/C 형식]

🔴 결정 필요: [상황 한 줄 요약]

옵션 A: [선택지 + 장단점]
옵션 B: [선택지 + 장단점]
옵션 C: [선택지 + 장단점]

내 추천: [옵션 X 이유]

Simon이 결정하시면 즉시 진행하겠습니다.
```

---

## 6. 잔향 영혼 보호 체크리스트 (매 Phase 끝)

```
[ ] 영혼 1: 메타피직스 갈래 D 유지 (잠들기 직전 30분)
[ ] 영혼 2: the Voice 4단계 정체 공개 곡선 위배 X
[ ] 영혼 3: 보스 = 모남+꿈자국 조각 (적 X)
[ ] 영혼 4: 위로하는 게임 (폭력·경쟁 추가 X)
[ ] 영혼 5: 미완성의 보존 (성취 강제 X)
```

위배 발견 시 — Simon에게 즉시 보고 + 옵션 A/B/C 제시.

---

> ***"잔향이 — 잠시, 머물렀어요."***

**Phase 1 시작 명령**: 위 §0의 메시지를 Claude Code에게 던지세요.
**예상 완료**: Day 7 (1주 후)
**다음 인계**: PHASE2_BUILD_PROMPT.md (Phase 1 완료 후 Simon이 작성)
