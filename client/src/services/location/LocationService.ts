/* LocationService — GPS 추상화 인터페이스.
 *
 * Phase 0: MockLocationService 4×4 grid + 사전 정의 좌표 (이 폴더)
 * Phase 1+: CapacitorLocationService — 실 GPS + H3 hex 매핑 (Phase 1에서 추가)
 *
 * UI(MapScreen)는 동일. service swap만으로 실 GPS 전환.
 */

import type { ResonanceTier } from '@/services/resonanceTiers';

/** 그리드 좌표 — Phase 0는 4×4 hex grid의 (col, row).
 *  Phase 1+는 H3 hex ID 또는 lat/lng로 swap. */
export interface Position {
  x: number;
  y: number;
}

/** 동네 셀 — 위치별 시적 라벨. */
export interface Cell {
  position: Position;
  /** 동네 라벨 — 사용자 위치 이동 시 화면 상단에 노출 */
  label: string;
}

export type PinKind = 'forgetter';

export interface Pin {
  id: string;
  position: Position;
  kind: PinKind;
  /** 잊혀진 자 종류 — tier 기반 5체 archetype 매핑용 */
  bossTier: ResonanceTier;
}

export interface LocationState {
  player: Position;
  pins: Pin[];
  cells: Cell[];
}

export interface LocationService {
  /** 초기 상태 — 게임 진입 시 1회 */
  getInitialState(currentTier: ResonanceTier): LocationState;
  /** 사용자 이동 — dx/dy ∈ {-1, 0, 1}, 그리드 경계 클램프 */
  move(state: LocationState, dx: number, dy: number): LocationState;
  /** 사용자 위치에 핀이 있으면 반환 (자동 조우용) */
  pinAt(state: LocationState, position: Position): Pin | null;
  /** 핀 제거 (전투 종료 후) — Phase 1+ 서버 동기화 시 cool-down 추가 */
  removePin(state: LocationState, pinId: string): LocationState;
}
