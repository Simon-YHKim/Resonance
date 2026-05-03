import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  value: number;
  max: number;
  color: 'hp' | 'stamina' | 'resonance';
}

const COLORS: Record<Props['color'], string> = {
  hp: 'bg-danger',
  stamina: 'bg-origin',
  resonance: 'bg-resonance',
};

export function StatBar({ label, value, max, color }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  // 데미지(value 감소) 시 짧은 셰이크 — 회복(증가)은 무진동 (긍정 톤)
  const prevRef = useRef(value);
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (value < prevRef.current) {
      setShaking(true);
      const id = setTimeout(() => setShaking(false), 320);
      prevRef.current = value;
      return () => clearTimeout(id);
    }
    prevRef.current = value;
  }, [value]);

  return (
    <div className={`w-full ${shaking ? 'animate-damage-shake' : ''}`}>
      <div className="flex justify-between text-xs text-fg-muted mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{value} / {max}</span>
      </div>
      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className={`h-full ${COLORS[color]} transition-[width] duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
