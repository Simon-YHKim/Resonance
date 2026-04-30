import { useEffect, useRef, useState } from 'react';

/* useCountUp — 숫자가 from → to로 부드럽게 카운트 업.
 *
 * 사용처: ResultScreen 누적 잔잔 (이전값 → 현재값 상승 보상감).
 * Phase 0는 ResultScreen만. Phase 1+ 캐릭터 시트 등 확대 가능.
 *
 * 안전:
 *   - to 변경 시 즉시 새 to에서 다시 시작
 *   - reduce-motion 사용자 (prefers-reduced-motion: reduce) 즉시 to 반환
 *   - 컴포넌트 언마운트 시 RAF 정리
 */

export function useCountUp(to: number, durationMs = 700, from = 0): number {
  const [n, setN] = useState(from);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    /* prefers-reduced-motion 존중 — 애니메이션 X, 즉시 to */
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setN(to);
      return;
    }

    const start = performance.now();
    const startVal = n;
    const delta = to - startVal;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(startVal + delta * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // n은 의도적으로 deps 제외 — to 변경 시에만 재시작
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, durationMs]);

  return n;
}
