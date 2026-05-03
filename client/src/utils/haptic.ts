/* 모바일 햅틱 피드백 — Capacitor 네이티브 우선, 웹 fallback.
 *
 * Phase 0: PWA 환경에서 navigator.vibrate 직접 사용. Capacitor 빌드는
 *   Phase 1 이후 @capacitor/haptics 추가하며 이 모듈에 통합.
 * 안전: 미지원 디바이스는 silent no-op (예외 안 던짐). */

type Strength = 'tap' | 'soft' | 'firm' | 'promotion';

const PATTERNS: Record<Strength, number | number[]> = {
  /** 버튼 탭 — 가장 짧은 단발 */
  tap: 10,
  /** 화면 전환·확정 — 부드러운 단발 */
  soft: 20,
  /** 결말·중요 액션 — 두 번 진동 */
  firm: [25, 35, 25],
  /** tier 승급 — 길고 깊은 패턴 (잔향이 호명하는 순간) */
  promotion: [40, 60, 40, 60, 80],
};

let unsupported = false;

export function haptic(strength: Strength = 'tap'): void {
  if (unsupported) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    unsupported = true;
    return;
  }
  try {
    navigator.vibrate(PATTERNS[strength]);
  } catch {
    // 일부 브라우저(예: 사용자 제스처 없는 컨텍스트)에서 throw 가능 — 무시
  }
}
