/* Mock GPS — Phase 0 단독 동작용.
 *
 * 4×4 hex grid (16 cells) + 4 잊혀진 자 핀.
 * 사용자 시작 위치 (1, 2) — 가운데 약간 아래.
 *
 * Phase 1+ swap 가이드:
 *   - CapacitorLocationService implements LocationService
 *   - getInitialState: navigator.geolocation.getCurrentPosition + H3 hex
 *   - move: GPS 변화 시 자동 갱신 (사용자가 실제로 걷기)
 *   - pinAt: 같은 H3 hex의 잊혀진 자 1체 (서버 fetch)
 */

import type {
  Cell,
  LocationService,
  Pin,
  Position,
} from './LocationService';
import type { ResonanceTier } from '@/services/resonanceTiers';

const GRID_W = 4;
const GRID_H = 4;

/** 4×4 그리드 셀 라벨 — 16 동네 장소 풀에서 일부 채택.
 *  Phase 1+ 실 GPS 도입 시 hex 메타와 매핑. */
const CELLS: ReadonlyArray<Cell> = [
  // y=0 (가장 위, 도시 외곽)
  { position: { x: 0, y: 0 }, label: '오래된 빌라 옥상' },
  { position: { x: 1, y: 0 }, label: '학교 담벼락 모퉁이' },
  { position: { x: 2, y: 0 }, label: '한강 둔치 산책로' },
  { position: { x: 3, y: 0 }, label: '아파트 단지 그늘' },
  // y=1
  { position: { x: 0, y: 1 }, label: '시장통 좌판 끝' },
  { position: { x: 1, y: 1 }, label: '편의점 깜빡이는 골목' },
  { position: { x: 2, y: 1 }, label: '버스 정류장 뒤편' },
  { position: { x: 3, y: 1 }, label: '놀이터 모래밭' },
  // y=2 (사용자 시작 위치)
  { position: { x: 0, y: 2 }, label: '문 닫힌 세탁소 앞' },
  { position: { x: 1, y: 2 }, label: '횡단보도 사거리' },
  { position: { x: 2, y: 2 }, label: '빨래 걸린 골목' },
  { position: { x: 3, y: 2 }, label: '24시 김밥집 입구' },
  // y=3 (가장 아래, 도시 깊은 곳)
  { position: { x: 0, y: 3 }, label: '지하철 출구 끝' },
  { position: { x: 1, y: 3 }, label: '공원 가로등' },
  { position: { x: 2, y: 3 }, label: '빈 상가 셔터' },
  { position: { x: 3, y: 3 }, label: '오래된 다방 의자' },
];

/** 초기 잊혀진 자 핀 4개 — 사용자 시작 위치(1, 2) 외 4 코너 근처.
 *  bossTier는 사용자 현재 tier 기반 — pickForgetter()와 일관성. */
function buildInitialPins(currentTier: ResonanceTier): Pin[] {
  return [
    { id: 'p-nw', position: { x: 0, y: 0 }, kind: 'forgetter', bossTier: currentTier },
    { id: 'p-ne', position: { x: 3, y: 0 }, kind: 'forgetter', bossTier: currentTier },
    { id: 'p-sw', position: { x: 0, y: 3 }, kind: 'forgetter', bossTier: currentTier },
    { id: 'p-se', position: { x: 3, y: 3 }, kind: 'forgetter', bossTier: currentTier },
  ];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export const mockLocation: LocationService = {
  getInitialState(currentTier) {
    return {
      player: { x: 1, y: 2 }, // 시작: 편의점 깜빡이는 골목
      pins: buildInitialPins(currentTier),
      cells: [...CELLS],
    };
  },

  move(state, dx, dy) {
    return {
      ...state,
      player: {
        x: clamp(state.player.x + dx, 0, GRID_W - 1),
        y: clamp(state.player.y + dy, 0, GRID_H - 1),
      },
    };
  },

  pinAt(state, position) {
    return (
      state.pins.find(
        (p) => p.position.x === position.x && p.position.y === position.y,
      ) ?? null
    );
  },

  removePin(state, pinId) {
    return { ...state, pins: state.pins.filter((p) => p.id !== pinId) };
  },
};

/** 그리드 dimension 외부 노출 — UI 좌표 계산용. */
export const GRID = { w: GRID_W, h: GRID_H };

/** 셀 라벨 조회 — UI 화면 상단에 노출 */
export function cellLabelAt(position: Position): string {
  const c = CELLS.find(
    (c) => c.position.x === position.x && c.position.y === position.y,
  );
  return c?.label ?? '거리';
}
