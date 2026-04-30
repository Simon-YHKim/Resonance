/* 기억 순간 — 결말 자동 캡처 (v2.3 §22.3 memory_moment 스키마 Phase 0).
 *
 * 매 전투 결말마다 짧은 한 줄과 메타가 누적 → 시트 타임라인.
 * Phase 1+ LLM emotion_tag 강도 ≥ 7 자동 감지 + 수동 "기억하기" 버튼
 * (v2.3 §22.2 멀티 트리거).
 */

import type { CombatOutcome } from '@/types/game';

export interface MemoryMoment {
  /** 단순 nanoid: ts + 랜덤 4자리 (Phase 0). Phase 1+ 서버 uuid. */
  id: string;
  /** 캡처 시각 (ms) */
  ts: number;
  /** 결말 종류 */
  outcome: CombatOutcome;
  /** 그 전투의 적 이름 */
  bossName: string;
  /** 캡처 시점의 누적 잔잔 */
  resonanceAt: number;
  /** 캐릭터 닉네임 (재플레이 후 다른 닉네임 비교 가능) */
  nickname: string;
}

interface MomentLineRule {
  outcome: CombatOutcome;
  /** boss 이름에 포함되는 키워드 (없으면 모든 보스 매칭) */
  bossKeyword?: string;
  line: string;
}

/* outcome × boss 매트릭스로 짧은 한 줄. 가장 구체적인 룰부터 매칭.
 * 어린 너(5체) victory는 가장 깊은 결의. */
const LINE_RULES: ReadonlyArray<MomentLineRule> = [
  /* victory — 보스별 특화 */
  {
    outcome: 'victory',
    bossKeyword: '어린 너',
    line: '작은 손이 너의 손을 잠시 잡았다 놓았다.',
  },
  {
    outcome: 'victory',
    bossKeyword: '청년의 거짓말',
    line: '한쪽만 올라갔던 미소가 결국 양쪽으로 풀렸다.',
  },
  {
    outcome: 'victory',
    bossKeyword: '어른의 가면',
    line: '셔츠 옷깃의 얼룩이 한 번 더 옅어진 것을 너는 보았다.',
  },
  {
    outcome: 'victory',
    bossKeyword: '청소년의 침묵',
    line: '굳어 있던 입술이 잠시, 한 박자만큼 벌어졌다.',
  },
  {
    outcome: 'victory',
    bossKeyword: '어린 시절',
    line: '작은 가방이 잠깐, 너의 어깨 위에 다시 얹혔다.',
  },
  /* defeat — 모든 보스 공통 */
  {
    outcome: 'defeat',
    line: '거리가 너를 받아내지 못했다. 너는 그것을 기억한다.',
  },
  {
    outcome: 'fled',
    line: '도망친 자리는 한 박자 더 길게 너를 따라온다.',
  },
  {
    outcome: 'stalemate',
    line: '안개 속에서 너희는 서로의 호흡을 한 번씩 들이마셨다.',
  },
];

/** outcome × boss → 짧은 한 줄 매칭. 가장 먼저 매칭되는 룰 반환. */
export function shortLineFor(outcome: CombatOutcome, bossName: string): string {
  for (const rule of LINE_RULES) {
    if (rule.outcome !== outcome) continue;
    if (rule.bossKeyword && !bossName.includes(rule.bossKeyword)) continue;
    return rule.line;
  }
  // 폴백 — 위 룰이 outcome 4종 모두 커버하므로 도달 불가능
  return '거리가 너를 한 박자 늦게 보낸다.';
}

/** 단순 ID — ts + Math.random 4자리. Phase 1+ 서버 uuid. */
export function newMomentId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`;
}

/** 표시용 시각 — "MM/DD HH:mm". 같은 닉네임 여러 전투 비교 가능. */
export function formatMomentTime(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}
