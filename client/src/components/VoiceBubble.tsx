import type { ReactNode } from 'react';

interface Props {
  speaker?: 'voice' | 'system' | 'enemy';
  children: ReactNode;
}

const SPEAKER_LABEL: Record<NonNullable<Props['speaker']>, string> = {
  voice: '목소리',
  system: '잔향',
  enemy: '잊혀진 자',
};

const SPEAKER_COLOR: Record<NonNullable<Props['speaker']>, string> = {
  voice: 'text-resonance',
  system: 'text-fg-muted',
  enemy: 'text-danger',
};

/** 화자별 스타일링된 대사 박스 */
export function VoiceBubble({ speaker = 'voice', children }: Props) {
  return (
    <div className="border-l-2 border-bg-elevated pl-4 py-1 animate-fade-in">
      <div className={`text-[0.65rem] tracking-[0.2em] uppercase mb-2 ${SPEAKER_COLOR[speaker]}`}>
        {SPEAKER_LABEL[speaker]}
      </div>
      <div className="display-text text-fg-primary text-base leading-relaxed">
        {children}
      </div>
    </div>
  );
}
