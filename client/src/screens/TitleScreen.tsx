import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';

export function TitleScreen() {
  const goTo = useGame((s) => s.goTo);
  const character = useGame((s) => s.character);
  const totalResonance = useGame((s) => s.totalResonance);

  return (
    <div className="vignette min-h-full flex flex-col items-center justify-center px-8 py-12 game-ui">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="display-text text-[8rem] leading-none text-fg-primary mb-2 animate-fade-in-slow">殘</div>
        <h1 className="display-text text-3xl tracking-[0.4em] text-fg-primary animate-fade-in">잔 향</h1>
        <p className="text-fg-muted text-xs tracking-[0.3em] mt-3 animate-fade-in">RESONANCE</p>
        <p className="text-fg-dim text-sm mt-12 text-center animate-fade-in italic">
          당신의 이름은,<br />잔향이 된다.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3 animate-fade-in">
        <ActionButton onClick={() => goTo('nicknameInput')}>
          {character ? '이름을 다시 부른다' : '이름을 가진 자'}
        </ActionButton>
        {character && (
          <p className="text-fg-dim text-xs text-center tabular-nums">
            누적 잔잔 · {totalResonance}
          </p>
        )}
      </div>
    </div>
  );
}
