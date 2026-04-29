/* 동네 장소 flavor — "동네가 던전이 된다"는 게임 정체성을 위한 장소 변주.
 *
 * 잊혀진 자가 등장하는 장소를 매번 살짝 다르게 보여준다. 첫 조우 텍스트
 * 앞에 한 줄 prefix로 붙여, 같은 적이라도 다른 거리에서 만난 느낌.
 *
 * Phase 0: 일반적 동네 장소 8종 (시장·골목·옥상·공원 등). Phase 1+ GPS 연동
 * 시 실제 사용자 위치 메타로 교체 (예: "편의점 앞", "지하철 출구").
 */

const LOCATIONS_NEUTRAL: ReadonlyArray<string> = [
  '시장통 좌판이 끝나는 자리',
  '편의점 간판의 불빛이 깜빡이는 골목',
  '오래된 빌라 옥상으로 올라가는 계단',
  '공원 벤치 옆, 가로등이 한 박자 늦게 켜지는 자리',
  '버스 정류장 뒤편, 광고판이 반쯤 떨어진 벽',
  '학교 담벼락이 끝나고 길이 좁아지는 모퉁이',
  '아파트 단지 사이, 그늘이 길게 누운 자리',
  '문 닫힌 세탁소 앞, 회전 간판만 천천히 도는 자리',
];

/** 결정적 장소 픽 — turn count 기반으로 매번 같은 위치에서 같은 장소.
 *  완전 랜덤 아닌 이유: 사용자가 "여기 또 그 자리네"를 인지하도록. */
export function pickLocation(seed: number): string {
  const idx = Math.abs(seed) % LOCATIONS_NEUTRAL.length;
  return LOCATIONS_NEUTRAL[idx];
}

/** 첫 조우 텍스트에 장소 prefix 합성. */
export function withLocation(encounter: string, seed: number): string {
  const place = pickLocation(seed);
  return `${place}.\n${encounter}`;
}
