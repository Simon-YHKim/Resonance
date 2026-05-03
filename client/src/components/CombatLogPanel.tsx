/* CombatLogPanel — 도스 풍 누적 전투 로그 (v2.4 §28.2 텍스트 vs 매크로).
 *
 * 각 turn의 묘사가 누적. 새 라인 추가 시 자동 스크롤 bottom.
 * 도스 풍: monospace 또는 display-text, ▸/[N턴] prefix.
 *
 * Phase 1+ LLM 도입 시:
 *   - 한 turn에 여러 라인 (공격 묘사 + 적 반응 + 환경 묘사)
 *   - 사용자별 emotion_tag로 색조 변화 가능
 */

import { useEffect, useRef } from 'react';

interface Props {
  log: string[];
}

export function CombatLogPanel({ log }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 라인 추가 시 자동 bottom 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [log.length]);

  return (
    <div className="my-3">
      <p className="text-fg-dim text-[0.6rem] tracking-[0.3em] uppercase mb-1">
        전투 기록
      </p>
      <div
        ref={scrollRef}
        className="max-h-32 overflow-y-auto border border-bg-elevated/60 rounded-sm
                   bg-bg-secondary/30 px-3 py-2 space-y-1 text-[0.65rem] leading-relaxed
                   font-mono text-fg-muted"
        role="log"
        aria-live="polite"
        aria-label="전투 로그"
      >
        {log.map((line, i) => (
          <p
            key={i}
            className={
              line.startsWith('◎')
                ? 'text-resonance/90 display-text font-sans text-xs'
                : line.startsWith('▸')
                  ? 'text-fg-dim italic'
                  : 'text-fg-muted'
            }
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
