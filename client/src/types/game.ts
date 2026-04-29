/* 잔향 도메인 타입
 * 기획서 v2.4 §27 닉네임 시스템 + v2.3 종합 기여도 일부 */

/** 닉네임 위험 카테고리 — Phase 0는 A·B·D·H 4종 (v2.4 §27.10 + B 추가)
 *  Phase 2에서 C·E 추가, Phase 3에서 F·G 추가 */
export type NicknameCategory = 'A' | 'B' | 'D' | 'H';

/** 4대 키워드 (v1.0 인게임 워딩 사전) */
export type Keyword = '희생' | '꿈과현실' | '어린시절' | '추억';

/** 카테고리별 게임 메커니즘 보너스 (v2.4 §27.3 변환표)
 *  Phase 0는 표시하지 않음 — "숨겨진 시스템" (v2.4 §27.4) */
export interface CategoryBonuses {
  /** 어린시절 보스전 크리티컬 가산 (A) */
  childhoodBossCrit?: number;
  /** 평생 1회 자동 부활 (A) */
  autoReviveOnce?: boolean;
  /** "그림자 형태" 회심 가산 (D) */
  shadowFormCrit?: number;
  /** 잊혀진 자 류 추가 데미지 (D) */
  forgetterDamageBonus?: number;
  /** 동명이인 조우 시 잔잔 가산 (B) — Phase 1에서 즉사기, Phase 0는 표시만 */
  resonanceLink?: number;
  /** 일반 (H) */
  none?: true;
}

/** 닉네임 LLM 변환 결과 — D1 user_nickname_metadata 영구 저장 (v2.4 §27.5) */
export interface CharacterSheet {
  /** 사용자가 입력한 원본 */
  nickname: string;
  /** LLM 분류 */
  category: NicknameCategory;
  /** 짧은 캐릭터 컨셉 (the Voice 시점) */
  characterConcept: string;
  /** 외형 묘사 1~2문장 */
  appearance: string;
  /** 시작 클래스 명 */
  startingClass: string;
  /** 연결된 4대 키워드 1~2개 */
  linkedKeywords: Keyword[];
  /** 카테고리 보너스 */
  categoryBonuses: CategoryBonuses;
  /** the Voice 첫 발화 — 캐릭터 생성 화면에서 스트리밍 */
  voiceFirstLine: string;
  /** 생성 타임스탬프 */
  createdAt: number;
}

/** 전투 액션 — Phase 0는 3종 (v2.4 §28.2 텍스트 vs 매크로 vs 스킬) */
export type CombatAction = 'attack' | 'dialogue' | 'flee';

/** 단일 전투 상태 — 잊혀진 자 1체 vs the Named */
export interface CombatState {
  player: { hp: number; maxHp: number; stamina: number; maxStamina: number };
  enemy: { name: string; description: string; hp: number; maxHp: number };
  /** 진행한 턴 수 */
  turn: number;
  /** 누적 잔잔 (v2.3 BOTW식 잔잔 누적) */
  resonance: number;
}

/** 전투 결말 */
export type CombatOutcome = 'victory' | 'defeat' | 'fled';

/** 1턴 진행 결과 */
export interface CombatTurnResult {
  /** the Voice 또는 시스템의 내레이션 (스트리밍) */
  narration: string;
  /** 플레이어/적 데미지 — 부호 있는 정수 */
  playerHpDelta: number;
  playerStaminaDelta: number;
  enemyHpDelta: number;
  /** 잔잔 가산 — 깊이 있는 선택은 +↑ */
  resonanceDelta: number;
}

/** 화면 상태 머신 — Phase 0 6개 화면 */
export type Screen =
  | 'title'
  | 'nicknameInput'
  | 'characterCreation'
  | 'characterSheet'
  | 'combat'
  | 'result';
