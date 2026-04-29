import { useState } from 'react';
import { ActionButton } from '@/components/ActionButton';
import { VoiceBubble } from '@/components/VoiceBubble';
import { useGame } from '@/store/gameStore';

const MAX_LEN = 12;

export function NicknameInputScreen() {
  const [value, setValue] = useState('');
  const goTo = useGame((s) => s.goTo);
  const setPendingNickname = useGame((s) => s.setPendingNickname);

  const trimmed = value.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= MAX_LEN;

  const handleConfirm = () => {
    if (!valid) return;
    setPendingNickname(trimmed);
    goTo('characterCreation');
  };

  return (
    <div className="vignette min-h-full flex flex-col px-8 py-12 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        <VoiceBubble speaker="voice">
          당신을 그렇게 부르던 사람이 있었지.<br />
          <span className="text-fg-muted">…그 이름을 들려다오.</span>
        </VoiceBubble>

        <div className="mt-12 w-full">
          <input
            type="text"
            value={value}
            maxLength={MAX_LEN}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            placeholder="이름"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent border-b border-bg-elevated focus:border-resonance
                       outline-none display-text text-2xl text-center py-3
                       text-fg-primary placeholder:text-fg-dim transition-colors"
          />
          <div className="text-right text-fg-dim text-xs mt-2 tabular-nums">
            {trimmed.length} / {MAX_LEN}
          </div>
        </div>

        <p className="text-fg-dim text-xs mt-8 leading-relaxed">
          어떤 이름이든 좋다. 잔향은 받아낼 수 있는 만큼만 받아낸다.
        </p>
      </div>

      <div className="max-w-sm w-full mx-auto space-y-3">
        <ActionButton onClick={handleConfirm} disabled={!valid}>
          확정
        </ActionButton>
        <ActionButton variant="subtle" onClick={() => useGame.getState().goTo('title')}>
          ← 처음으로
        </ActionButton>
      </div>
    </div>
  );
}
