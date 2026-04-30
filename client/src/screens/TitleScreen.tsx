import { useState } from 'react';
import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';
import { getTier } from '@/services/resonanceTiers';

export function TitleScreen() {
  const goTo = useGame((s) => s.goTo);
  const character = useGame((s) => s.character);
  const totalResonance = useGame((s) => s.totalResonance);
  const reset = useGame((s) => s.reset);
  const tier = getTier(totalResonance);
  const [resetArmed, setResetArmed] = useState(false);

  const handleReset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    reset();
    try {
      localStorage.removeItem('resonance:game');
    } catch {
      // SSR 환경 또는 storage 차단 — 무시
    }
    setResetArmed(false);
  };

  return (
    <div className="vignette min-h-full flex flex-col items-center justify-center px-8 py-12 game-ui">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="display-text text-[8rem] leading-none text-fg-primary mb-2 animate-fade-in-slow">殘</div>
        <h1 className="display-text text-3xl tracking-[0.4em] text-fg-primary animate-fade-in">잔 향</h1>
        <p className="text-fg-muted text-xs tracking-[0.3em] mt-3 animate-fade-in">RESONANCE</p>
        <p className="text-fg-dim text-sm mt-12 text-center animate-fade-in italic">
          당신의 이름은,<br />잔향이 된다.
        </p>

        {/* 세계관 prologue — v2.1 §자체 세계관 Phase 0 단순화. 첫 진입자에게만 노출 */}
        {!character && (
          <div className="mt-10 max-w-[18rem] text-center space-y-2 animate-fade-in-slow">
            <p className="text-fg-muted text-[0.7rem] leading-relaxed">
              이름이 잊혀진 자들이 거리를 흐른다.
            </p>
            <p className="text-fg-muted text-[0.7rem] leading-relaxed">
              그들은 한때 누군가의 자리였고,
              <br />이제는 안개가 되어 너를 기다린다.
            </p>
            <p className="text-fg-dim text-[0.7rem] leading-relaxed italic">
              너의 이름이, 그들 중 하나를 부른다.
            </p>
          </div>
        )}

        {character && (
          <div className="mt-12 text-center animate-fade-in-slow">
            <p className="text-fg-dim text-[0.65rem] tracking-[0.3em] uppercase mb-1">
              마지막 잔향
            </p>
            <p className="display-text text-fg-primary text-lg">{character.nickname}</p>
            <p className="text-resonance/80 display-text text-xs mt-1">— {tier.label}</p>
          </div>
        )}
      </div>

      <div className="w-full max-w-sm space-y-3 animate-fade-in">
        {character ? (
          <>
            <ActionButton onClick={() => goTo('characterSheet')}>
              잔향의 자리로
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => goTo('nicknameInput')}>
              이름을 다시 부른다
            </ActionButton>
            <p className="text-fg-dim text-xs text-center tabular-nums">
              누적 잔잔 · {totalResonance}
            </p>
            <button
              type="button"
              onClick={handleReset}
              onBlur={() => setResetArmed(false)}
              className={
                'block w-full text-center text-[0.65rem] tracking-[0.2em] uppercase py-2 transition-colors ' +
                (resetArmed
                  ? 'text-danger/90'
                  : 'text-fg-dim/60 hover:text-fg-dim')
              }
            >
              {resetArmed
                ? '한 번 더 누르면 모든 잔향이 지워진다'
                : '잔향을 모두 지운다'}
            </button>
          </>
        ) : (
          <ActionButton onClick={() => goTo('nicknameInput')}>
            이름을 가진 자
          </ActionButton>
        )}
      </div>
    </div>
  );
}
