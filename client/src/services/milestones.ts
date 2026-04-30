/* 잔잔 마일스톤 — 100단위 round number 보너스 알림.
 *
 * tier 임계(0/50/150/400/1000)와 별개. 잔잔이 round number 넘을 때
 * 작은 알림으로 사용자 보상감 누적. 같은 tier 안에서도 진행감.
 *
 * 마일스톤 풀: 100, 200, 300, 500, 750, 1500, 2000.
 *   (50/150/400/1000은 tier 임계라 중복 제외)
 */

interface Milestone {
  threshold: number;
  message: string;
}

const MILESTONES: ReadonlyArray<Milestone> = [
  { threshold: 100, message: '거리가 너의 발자국을 백 자 새긴다.' },
  { threshold: 200, message: '잔향은 너의 호흡을 이백 자 기억한다.' },
  { threshold: 300, message: '너는 이 거리에서 더 이상 객이 아니다.' },
  { threshold: 500, message: '잔향이 너의 이름을 오백 자 부른다.' },
  { threshold: 750, message: '원의 자리가 한 발짝 더 가깝다.' },
  { threshold: 1500, message: '어린 너가 손을 한 박자 늦게 내린다.' },
  { threshold: 2000, message: '너의 잔향이 이제 거리를 흔든다.' },
];

/** before → after 사이에 새로 넘은 가장 큰 마일스톤 1건 반환.
 *  여러 개 동시 통과 시 가장 높은 것만 (메시지 중첩 방지).
 *  before > after (감소) 또는 변동 없음 → null. */
export function crossedMilestone(before: number, after: number): Milestone | null {
  if (after <= before) return null;
  let highest: Milestone | null = null;
  for (const m of MILESTONES) {
    if (before < m.threshold && after >= m.threshold) {
      if (highest === null || m.threshold > highest.threshold) {
        highest = m;
      }
    }
  }
  return highest;
}
