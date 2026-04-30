import { useEffect, useRef, useState } from 'react';
import { ActionButton } from '@/components/ActionButton';
import { StatBar } from '@/components/StatBar';
import { VoiceBubble } from '@/components/VoiceBubble';
import { CombatLogPanel } from '@/components/CombatLogPanel';
import { BattleVisualPanel } from '@/components/BattleVisualPanel';
import { mockLLM } from '@/services/llm/MockLLMService';
import { useGame } from '@/store/gameStore';
import type { CombatAction, CombatTurnResult } from '@/types/game';
import {
  TURN_LIMIT,
  evaluateOutcome,
  resonanceBonusFor,
} from '@/services/combatOutcome';
import { getTier } from '@/services/resonanceTiers';
import { rollShardDrop, shardForBoss } from '@/services/shards';
import { anchorsFor } from '@/services/anchors';
import { newMomentId } from '@/services/memoryMoments';
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
  const combatLog = useGame((s) => s.combatLog);
  const appendCombatLog = useGame((s) => s.appendCombatLog);
  const updateCombat = useGame((s) => s.updateCombat);
  const endCombat = useGame((s) => s.endCombat);
  const goTo = useGame((s) => s.goTo);

  const [status, setStatus] = useState<Status>('encounter');
  const [narration, setNarration] = useState('');
  /* 자유 텍스트 입력 — Phase 0 placeholder (사용자 직접 묘사).
   * Phase 1+ Anthropic Haiku/Gemini가 해석 → combat 효과 결정.
   * Phase 0는 dialogue 처럼 처리 + 입력 텍스트가 그대로 narration. */
  const [freeText, setFreeText] = useState('');
  const FREE_TEXT_COST = 10;
  /* 매크로 — 한 전투 내 직전 액션 (Phase 0). 전투 종료 후 리셋.
   * v2.2 §자유 매크로의 단순화: 한 키워드 액션 반복.
   * Phase 1+ WoW식 다중 액션 시퀀스 + 사용자 정의 매크로명. */
  const [lastAction, setLastAction] = useState<CombatAction | null>(null);
  const cancelRef = useRef(false);
  /* 전투 통계 — 결말 시 종합 기여도 분류용 (v2.3 §22.3 Phase 0) */
  const statsRef = useRef({ attackCount: 0, dialogueCount: 0, fleeCount: 0 });

  // 첫 조우 묘사 1회 재생 + 로그에 시작 라인 등록
  useEffect(() => {
    if (!combat) return;
    cancelRef.current = false;
    // 첫 진입 시 로그 시작 (한 번만)
    if (useGame.getState().combatLog.length === 0) {
      appendCombatLog(`▸ ${combat.enemy.name}을(를) 조우했다.`);
    }
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

  /* 자유 텍스트 묘사 — Phase 0 placeholder.
   * Phase 1+: 입력을 LLM에 보내 → emotion + 액션 + 효과 추출.
   * Phase 0: dialogue 처럼 처리 + 입력 텍스트를 narration으로. */
  const handleFreeText = async () => {
    const text = freeText.trim();
    if (!text || status !== 'idle') return;
    if (player.stamina < FREE_TEXT_COST) return;

    haptic('soft');
    setFreeText('');
    setStatus('narrating');
    // Phase 0: 입력 텍스트가 곧 narration. Phase 1+ LLM이 해석한 묘사로 교체.
    const narrationText = `당신 — "${text}"`;
    setNarration(narrationText);

    // 통계는 dialogue로 카운트 (성찰형 액션)
    statsRef.current.dialogueCount += 1;

    // 도스 로그에 추가
    appendCombatLog(`[${combat.turn + 1}턴 · 묘사] ${narrationText}`);

    // Phase 0 mock 효과 — dialogue와 같은 잔잔 가산, HP 영향 없음
    const tier = getTier(useGame.getState().totalResonance);
    const dialogueBonus = tier.actionBuffs.dialogueResonanceBonus;
    const ch = useGame.getState().character;
    if (ch) {
      const anchorIds = anchorsFor(ch.linkedKeywords);
      if (anchorIds.length > 0) {
        useGame.getState().addAnchorPoints(anchorIds);
      }
    }

    const newPlayerStamina = Math.max(0, player.stamina - FREE_TEXT_COST);
    const newResonance = resonance + 5 + dialogueBonus;
    const nextTurn = turn + 1;

    updateCombat({
      player: { ...player, stamina: newPlayerStamina },
      turn: nextTurn,
      resonance: newResonance,
    });

    await new Promise((r) => setTimeout(r, 600));

    const outcome = evaluateOutcome({
      nextTurn,
      playerHp: player.hp,
      enemyHp: enemy.hp,
      action: 'dialogue',
    });

    if (outcome) {
      // (전체 결말 흐름은 handleAction과 동일 — 너무 길어 dialogue로 위임)
      // 향후 LLM 통합 시 별도 분기. Phase 0는 turn 한도 도달 stalemate만 가능.
      const outcomeLabel =
        outcome === 'stalemate' ? '거리가 너를 보내준다' : '결말';
      appendCombatLog(`◎ ${outcomeLabel}.`);

      useGame.getState().setLastCombatStats({
        attackCount: statsRef.current.attackCount,
        dialogueCount: statsRef.current.dialogueCount,
        fleeCount: statsRef.current.fleeCount,
        totalTurns: nextTurn,
      });
      endCombat(outcome, newResonance + resonanceBonusFor(outcome));
      goTo('result');
      return;
    }

    setStatus('idle');
  };

  const handleAction = async (action: CombatAction, cost: number) => {
    if (status !== 'idle') return;
    if (player.stamina < cost) return;

    // 매크로 보존 — 도망 외 액션만 (도망은 결말이라 반복 의미 없음)
    if (action !== 'flee') setLastAction(action);

    // 통계 누적 (결말 시 종합 기여도 분류)
    if (action === 'attack') statsRef.current.attackCount += 1;
    else if (action === 'dialogue') statsRef.current.dialogueCount += 1;
    else if (action === 'flee') statsRef.current.fleeCount += 1;

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

    // 도스 풍 전투 로그 — turn마다 [너] / [잊혀진 자] 두 라인 분리
    const actionLabel =
      action === 'attack' ? '공격' : action === 'dialogue' ? '대화' : '도망';
    appendCombatLog(`[${combat.turn + 1}턴 · ${actionLabel}] ${result.narration}`);
    appendCombatLog(`  ↳ ${result.enemyNarration}`);

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

    // dialogue 액션 시 캐릭터 키워드와 매칭되는 거점에 +1 (v2.1 §추억 거점)
    if (action === 'dialogue') {
      const ch = useGame.getState().character;
      if (ch) {
        const anchorIds = anchorsFor(ch.linkedKeywords);
        if (anchorIds.length > 0) {
          useGame.getState().addAnchorPoints(anchorIds);
        }
      }
    }

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
      // outcome별 햅틱 — 결말의 무게에 맞춰
      haptic(
        outcome === 'victory' || outcome === 'defeat'
          ? 'firm'
          : outcome === 'fled'
            ? 'tap'
            : 'soft',
      );

      // victory 시 기억의 조각 드롭 판정 (v2.2 §18.2)
      // 첫 클리어 100% / 이후 4%.
      if (outcome === 'victory') {
        const shardId = shardForBoss(enemy.name);
        if (shardId !== null) {
          const owned = useGame
            .getState()
            .shards.some((s) => s.id === shardId);
          if (rollShardDrop(owned, Math.random())) {
            useGame.getState().addShard(shardId);
          }
        }
      }

      // 기억 순간 자동 캡처 (v2.3 §22.3)
      // 모든 4 outcome 캡처 — defeat/fled도 의미 있는 순간.
      const finalResonance =
        useGame.getState().totalResonance + newResonance + resonanceBonusFor(outcome);
      const ch = useGame.getState().character;
      if (ch) {
        useGame.getState().addMemoryMoment({
          id: newMomentId(),
          ts: Date.now(),
          outcome,
          bossName: enemy.name,
          resonanceAt: finalResonance,
          nickname: ch.nickname,
        });
      }

      // 종합 기여도 — 전투 통계 store에 기록 (결말 화면 표시)
      useGame.getState().setLastCombatStats({
        attackCount: statsRef.current.attackCount,
        dialogueCount: statsRef.current.dialogueCount,
        fleeCount: statsRef.current.fleeCount,
        totalTurns: nextTurn,
      });

      // 결말 라인 — 도스 풍 마지막 줄
      const outcomeLabel =
        outcome === 'victory'
          ? '잊혀진 자가 무너졌다'
          : outcome === 'defeat'
            ? '너는 무릎을 꿇었다'
            : outcome === 'fled'
              ? '너는 거리를 떠났다'
              : '거리가 너를 보내준다';
      appendCombatLog(`◎ ${outcomeLabel}.`);

      endCombat(outcome, newResonance + resonanceBonusFor(outcome));
      goTo('result');
      return;
    }

    setStatus('idle');
  };

  return (
    <div className="vignette min-h-full flex flex-col px-6 py-8 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        {/* 포켓몬식 전투 비주얼 — 적/플레이어 카드 (Phase 1+ 이미지 swap) */}
        <BattleVisualPanel
          combat={combat}
          tier={getTier(useGame.getState().totalResonance)}
          playerNickname={useGame.getState().character?.nickname ?? null}
        />

        {/* 내레이션 영역 — 현재 turn의 묘사 */}
        <div className="my-3 min-h-[80px]">
          <VoiceBubble speaker={status === 'encounter' ? 'system' : 'voice'}>
            <span>
              {narration}
              {(status === 'narrating' || status === 'encounter') && (
                <span className="inline-block w-[0.5em] animate-breathe text-resonance">▍</span>
              )}
            </span>
          </VoiceBubble>
        </div>

        {/* 도스 풍 전투 로그 — 누적, 스크롤. v2.4 §28.2 텍스트 vs 매크로 */}
        {combatLog.length > 0 && (
          <CombatLogPanel log={combatLog} />
        )}

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

      {/* 자유 텍스트 — Phase 1+ LLM 통합 placeholder.
          현재는 입력 텍스트가 narration으로 들어가고 dialogue처럼 처리. */}
      <div className="max-w-sm w-full mx-auto mb-2">
        <div className="flex gap-1">
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFreeText()}
            placeholder="…직접 묘사한다"
            disabled={status !== 'idle' || player.stamina < FREE_TEXT_COST}
            maxLength={80}
            className="flex-1 bg-bg-secondary/50 border border-bg-elevated rounded-sm
                       px-3 py-2 text-xs text-fg-primary placeholder:text-fg-dim/70
                       focus:border-resonance/50 focus:outline-none
                       disabled:opacity-40
                       transition-colors"
          />
          <button
            onClick={handleFreeText}
            disabled={
              !freeText.trim() ||
              status !== 'idle' ||
              player.stamina < FREE_TEXT_COST
            }
            className="px-3 py-2 border border-resonance/40 rounded-sm
                       text-resonance text-xs display-text
                       enabled:hover:bg-resonance/10 enabled:active:scale-95
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all"
          >
            묘사 −{FREE_TEXT_COST}
          </button>
        </div>
        <p className="text-fg-dim text-[0.6rem] mt-1 italic">
          Phase 1+ LLM이 너의 묘사를 해석한다.
        </p>
      </div>

      {/* 매크로 — 직전 액션 1탭 반복 (도망 제외) */}
      {lastAction && (() => {
        const macro = ACTIONS.find((a) => a.key === lastAction);
        if (!macro) return null;
        const insufficient = player.stamina < macro.cost;
        const disabled = status !== 'idle' || insufficient;
        return (
          <div className="max-w-sm w-full mx-auto mb-2">
            <button
              disabled={disabled}
              onClick={() => handleAction(macro.key, macro.cost)}
              className="w-full text-xs py-2 px-3 border border-resonance/30 text-resonance/80
                         rounded-sm bg-bg-secondary/50
                         enabled:hover:border-resonance/60 enabled:active:bg-bg-elevated
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors flex justify-center items-center gap-2"
            >
              <span>↻</span>
              <span className="display-text">{macro.label} 한 번 더</span>
              <span className="text-fg-dim tabular-nums">−{macro.cost}</span>
            </button>
          </div>
        );
      })()}

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
