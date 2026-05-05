/**
 * user_wiki 컨텍스트 주입 미들웨어 — 모든 LLM 호출의 토대.
 *
 * Phase 2~5 의 모든 LLM 호출 (보스전·길거리 몹·NPC 대화·매크로) 이
 * callLLMWithWiki() 를 거쳐 — 자동으로 사용자 컨텍스트 주입.
 *
 * code-health-guard:
 *   - 컨텍스트 주입 책임은 이 단일 파일.
 *   - LLM 호출 책임은 lib/llm.ts.
 *
 * Refs: 잔향_시스템명세_v1.4.md §2.3.1
 */

import type { NicknameAnalysis } from '@resonance/shared';
import { getUserWikiRow } from '../lib/wiki-store';

export type DominantAxis = 'gaehwa' | 'yeojeon' | 'hangno' | null;

export interface MilestoneEntry {
  event: string;
  ts: number;
  context?: string;
}

export interface UserWikiContext {
  userId: string;
  analysis: NicknameAnalysis;
  recentMilestones: MilestoneEntry[];
  dominantAxis: DominantAxis;
  axisLockedAt: number | null;
}

/**
 * D1 → UserWikiContext 변환.
 *
 * 우세 축 (3축 점수) 결정:
 *   - axisLockedAt 가 있을 때만 dominant 결정
 *   - 보스 4 처치 시점에 lock (50% 결정 — 시스템 명세 v1.4)
 */
export async function getUserWikiContext(
  db: D1Database,
  userId: string,
): Promise<UserWikiContext | null> {
  const row = await getUserWikiRow(db, userId);
  if (!row) return null;

  const analysis = JSON.parse(row.nickname_analysis_json) as NicknameAnalysis;

  const milestones: MilestoneEntry[] = row.milestones_json
    ? (JSON.parse(row.milestones_json) as MilestoneEntry[])
    : [];

  let dominantAxis: DominantAxis = null;
  if (row.axis_locked_at) {
    const { gaehwa_axis, yeojeon_axis, hangno_axis } = row;
    const max = Math.max(gaehwa_axis, yeojeon_axis, hangno_axis);
    if (max === 0) dominantAxis = null;
    else if (max === gaehwa_axis) dominantAxis = 'gaehwa';
    else if (max === yeojeon_axis) dominantAxis = 'yeojeon';
    else dominantAxis = 'hangno';
  }

  return {
    userId,
    analysis,
    recentMilestones: milestones.slice(-3),
    dominantAxis,
    axisLockedAt: row.axis_locked_at ?? null,
  };
}

/**
 * basePrompt 끝에 사용자 컨텍스트 블록 추가.
 *
 * 모든 LLM 호출이 이 함수를 거침. 누락된 wiki 필드는 안전하게 건너뜀.
 */
export function buildSystemPromptWithWiki(
  wiki: UserWikiContext,
  basePrompt: string,
): string {
  const { analysis: a } = wiki;

  const milestones =
    wiki.recentMilestones.length === 0
      ? '(없음)'
      : wiki.recentMilestones.map((m) => `- ${m.event}`).join('\n');

  const dominant =
    wiki.dominantAxis === null
      ? '(미결정)'
      : wiki.dominantAxis === 'gaehwa'
        ? '개화 (도약형)'
        : wiki.dominantAxis === 'yeojeon'
          ? '여전 (수용형)'
          : '항로 (절충형)';

  return `${basePrompt}

[사용자 컨텍스트 — 자동 주입]
닉네임: ${a.nickname}
직업: ${a.추정직업}
연령: ${a.추정연령}
환경: ${a.추정환경}
정서: ${a.정서적결}
주요키워드: ${a.주요키워드.join(', ')}
the Voice 호칭: ${a.the_Voice_호칭}

[최근 이정표]
${milestones}

[우세 축]
${dominant}

[안전 가이드라인]
- 미성년자 NPC 에게 부적절한 행동 시도 시 거절.
- 자해·자살 표현 시 따뜻한 톤 + 1393 안내.
- 한국어로 응답.

위 컨텍스트에 부합하는 한국어 응답을 작성하시오.`;
}
