/**
 * 공유 도메인 타입 — apps/web, apps/mobile 양쪽이 사용.
 *
 * Phase 1 은 NicknameAnalysis 만. Phase 2+ 에서 모남 조각·스킬 트리·매크로 추가.
 */

export type Screen =
  | 'title'
  | 'nicknameInput'
  | 'characterCreation'
  | 'hearth'
  | 'characterSheet'
  | 'map'
  | 'npc'
  | 'shop'
  | 'bestiary'
  | 'combat'
  | 'result';

export type DominantAxis = 'gaehwa' | 'yeojeon' | 'hangno' | null;

export interface UserWiki {
  user_id: string;
  nickname_analysis: import('../schemas/nickname-analysis').NicknameAnalysis;
  milestones?: Array<{ event: string; ts: number; context?: string }>;
  gaehwa_axis?: number;
  yeojeon_axis?: number;
  hangno_axis?: number;
  axis_locked_at?: number | null;
  created_at?: number;
  updated_at?: number;
}
