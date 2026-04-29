import { useEffect, useRef, useState } from 'react';
import { ActionButton } from '@/components/ActionButton';
import { StatBar } from '@/components/StatBar';
import { VoiceBubble } from '@/components/VoiceBubble';
import { mockLLM } from '@/services/llm/MockLLMService';
import { useGame } from '@/store/gameStore';
import type { CombatAction, CombatTurnResult } from '@/types/game';
import {
  TURN_LIMIT,
  evaluateOutcome,
  resonanceBonusFor,
} from '@/services/combatOutcome';
import { getTier } from '@/services/resonanceTiers';
import { haptic } from '@/utils/haptic';

type Status = 'encounter' | 'idle' | 'narrating' | 'resolving';

const ACTIONS: { key: CombatAction; label: string; cost: number; hint: string }[] = [
  { key: 'attack', label: '공격', cost: 15, hint: '깊게 들어간다' },
  { key: 'dialogue', label: '대화', cost: 5, hint: '먼저 묻는다' },
  { key: 'flee', label: '도망', cost: 25, hint: '거리를 둔다' },
];

const ENCOUNTER_MS_PER_CHAR = 28;

export function CombatScreen() {
  const combat = useGame((s) => s.combat);
  const updateCombat = useGame((s) => s.updateCombat);
  const endCombat = useGame((s) => s.endCombat);
  const goTo = useGame((s) => s.goTo);

  const [status, setStatus] = useState<Status>('encounter');
  const [narration, setNarration] = useState('');
  const cancelRef = useRef(false);

  // 첫 조우 묘사 1회 재생
  useEffect(() => {
    if (!combat) return;
    cancelRef.current = false;
    let i = 0;
    setNarration('');
    const text = combat.enemy.encounter;
    const id = setInterval(() => {
      if (cancelRef.current) {
        clearInterval(id);
        return;
      }
      i += 1;
      setNarration(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setStatus('idle');
      }
    }, ENCOUNTER_MS_PER_CHAR);
    return () => {
      cancelRef.current = true;
      clearInterval(id);
    };
    // mount 시 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!combat) {
    return (
      <div className="vignette min-h-full flex items-center justify-center p-8">
        <ActionButton onClick={() => goTo('title')}>처음으로</ActionButton>
      </div>
    );
  }

  const { player, enemy, turn, resonance } = combat;

  const handleAction = async (action: CombatAction, cost: number) => {
    if (status !== 'idle') return;
    if (player.stamina < cost) return;

    // 액션별 햅틱 — 공격은 firm(중요), 대화는 soft, 도망은 tap
    haptic(action === 'attack' ? 'firm' : action === 'dialogue' ? 'soft' : 'tap');

    setStatus('narrating');
    setNarration('');

    const gen = mockLLM.narrateCombat(combat, action);
    let buf = '';
    let result: CombatTurnResult | null = null;
    while (true) {
      const step = await gen.next();
      if (step.done) {
        result = step.value;
        break;
      }
      buf += step.value;
      setNarration(buf);
    }

    if (!result) return;

    // tier 기반 액션 보정 — 누적 잔잔이 깊을수록 같은 액션이 더 큰 효과.
    // dialogue: tier별 잔잔 보너스 추가, attack: tier별 데미지 배율.
    const tier = getTier(useGame.getState().totalResonance);
    const buffs = tier.actionBuffs;
    const dialogueBonus =
      action === 'dialogue' ? buffs.dialogueResonanceBonus : 0;
    const attackDamageBoost =
      action === 'attack'
        ? Math.round(result.enemyHpDelta * (buffs.attackDamageMultiplier - 1))
        : 0;

    const newPlayerHp = Math.max(0, Math.min(player.maxHp, player.hp + result.playerHpDelta));
    const newPlayerStamina = Math.max(
      0,
      Math.min(player.maxStamina, player.stamina + result.playerStaminaDelta),
    );
    const newEnemyHp = Math.max(
      0,
      Math.min(enemy.maxHp, enemy.hp + result.enemyHpDelta + attackDamageBoost),
    );
    const newResonance = resonance + result.resonanceDelta + dialogueBonus;
    const nextTurn = turn + 1;

    updateCombat({
      player: { ...player, hp: newPlayerHp, stamina: newPlayerStamina },
      enemy: { ...enemy, hp: newEnemyHp },
      turn: nextTurn,
      resonance: newResonance,
    });

    setStatus('resolving');
    // 결말 판정 — UX를 위해 0.6초 정지 후 전환
    await new Promise((r) => setTimeout(r, 600));

    const outcome = evaluateOutcome({
      nextTurn,
      playerHp: newPlayerHp,
      enemyHp: newEnemyHp,
      action,
    });

    if (outcome) {
      endCombat(outcome, newResonance + resonanceBonusFor(outcome));
      goTo('result');
      return;
    }

    setStatus('idle');
  };

  return (
    <div className="vignette min-h-full flex flex-col px-6 py-8 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        {/* 적 정보 */}
        <div className="mb-4">
          <p className="text-fg-dim text-[0.65rem] tracking-[0.2em] uppercase mb-1">조우</p>
          <p className="display-text text-lg text-danger mb-2">{enemy.name}</p>
          <StatBar label="잊혀진 자" value={enemy.hp} max={enemy.maxHp} color="hp" />
        </div>

        {/* 내레이션 영역 */}
        <div className="flex-1 my-4 min-h-[160px]">
          <VoiceBubble speaker={status === 'encounter' ? 'system' : 'voice'}>
            <span>
              {narration}
              {(status === 'narrating' || status === 'encounter') && (
                <span className="inline-block w-[0.5em] animate-breathe text-resonance">▍</span>
              )}
            </span>
          </VoiceBubble>
        </div>

        {/* 플레이어 상태 */}
        <div className="space-y-3 mb-6">
          <StatBar label="HP" value={player.hp} max={player.maxHp} color="hp" />
          <StatBar
            label="스태미나"
            value={player.stamina}
            max={player.maxStamina}
            color="stamina"
          />
          <div className="flex justify-between text-xs text-fg-muted tabular-nums">
            <span>턴 {turn} / {TURN_LIMIT}</span>
            <span>잔잔 +{resonance}</span>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="max-w-sm w-full mx-auto grid grid-cols-3 gap-2">
        {ACTIONS.map(({ key, label, cost, hint }) => {
          const insufficient = player.stamina < cost;
          const disabled = status !== 'idle' || insufficient;
          return (
            <button
              key={key}
              disabled={disabled}
              onClick={() => handleAction(key, cost)}
              className="flex flex-col items-center justify-center
                         px-2 py-3 border border-bg-elevated rounded-sm
                         bg-bg-secondary
                         enabled:hover:border-resonance/60 enabled:active:bg-bg-elevated
                         enabled:active:scale-[0.97]
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-150"
            >
              <span className="display-text text-base text-fg-primary">{label}</span>
              <span className="text-[0.6rem] text-fg-dim mt-1 tabular-nums">−{cost} 스태</span>
              <span className="text-[0.6rem] text-fg-muted">{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
