/* NPCScreen — 잊혀진 자들과의 만남.
 * 4 NPC 카드 → 클릭 시 대화 모달.
 *
 * Phase 0: 결정적 응답 4개씩, 이미지 없음 (한자 symbol fallback).
 * Phase 1+:
 *   - LLM 동적 대화 (성격 prompt + 캐릭터 컨텍스트)
 *   - Nano Banana Pro 이미지 (NPC별 1장)
 *   - 호감도 시스템 (대화 누적 → 합류)
 */

import { useState } from 'react';
import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';
import { NPCS, colorForMood } from '@/services/npcs';
import type { NPC } from '@/services/npcs';
import { haptic } from '@/utils/haptic';

export function NPCScreen() {
  const goTo = useGame((s) => s.goTo);
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  /* 표시 중인 대화 응답 (선택한 topic이 있을 때) */
  const [activeResponse, setActiveResponse] = useState<string | null>(null);

  const openNPC = (npc: NPC) => {
    haptic('soft');
    setActiveNPC(npc);
    setActiveResponse(null);
  };
  const closeNPC = () => {
    haptic('tap');
    setActiveNPC(null);
    setActiveResponse(null);
  };
  const pickTopic = (response: string) => {
    haptic('tap');
    setActiveResponse(response);
  };

  return (
    <div className="vignette min-h-full flex flex-col px-6 py-8 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 overflow-y-auto pb-6">
        <div className="text-center mb-6 animate-fade-in-slow">
          <p className="text-fg-dim text-[0.6rem] tracking-[0.4em] uppercase mb-2">
            잊혀진 자들과의 만남
          </p>
          <h2 className="display-text text-xl text-fg-primary mb-1">
            향로의 옆자리
          </h2>
          <p className="text-fg-muted text-xs italic">
            누가 너의 옆에 앉았는지 한 명씩 들어 보자.
          </p>
        </div>

        <ul className="space-y-3">
          {NPCS.map((npc) => (
            <li key={npc.id}>
              <button
                type="button"
                onClick={() => openNPC(npc)}
                className="w-full text-left p-4 border border-bg-elevated rounded-md
                           bg-bg-secondary/40
                           hover:border-resonance/50 active:bg-bg-elevated
                           active:scale-[0.99]
                           transition-all duration-150
                           flex items-center gap-3"
              >
                {/* Avatar — Phase 1+ <img src={npc.imageUrl} /> 으로 교체 */}
                <div
                  className={
                    'w-12 h-12 rounded-full border border-bg-elevated/60 ' +
                    'flex items-center justify-center display-text text-lg ' +
                    colorForMood(npc.mood)
                  }
                  aria-hidden="true"
                >
                  {npc.avatarSymbol}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="display-text text-fg-primary text-sm">
                    {npc.name}
                  </p>
                  <p className="text-fg-dim text-[0.65rem] tracking-wider">
                    {npc.role}
                  </p>
                  <p className="text-fg-muted text-xs italic mt-1 leading-snug truncate">
                    {npc.personality}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="max-w-sm w-full mx-auto">
        <ActionButton variant="ghost" onClick={() => goTo('hearth')}>
          ← 기억의 향로
        </ActionButton>
      </div>

      {/* NPC 대화 모달 */}
      {activeNPC && (
        <NPCDialogModal
          npc={activeNPC}
          response={activeResponse}
          onPickTopic={pickTopic}
          onClose={closeNPC}
        />
      )}
    </div>
  );
}

function NPCDialogModal({
  npc,
  response,
  onPickTopic,
  onClose,
}: {
  npc: NPC;
  response: string | null;
  onPickTopic: (response: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-bg-primary/85 flex items-end sm:items-center justify-center px-4 py-6 z-40 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${npc.name}과의 대화`}
    >
      <div
        className="w-full max-w-sm bg-bg-secondary border border-bg-elevated rounded-md p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className={
              'w-12 h-12 rounded-full border border-bg-elevated ' +
              'flex items-center justify-center display-text text-lg ' +
              colorForMood(npc.mood)
            }
            aria-hidden="true"
          >
            {npc.avatarSymbol}
          </div>
          <div className="flex-1">
            <p className="display-text text-fg-primary text-base">{npc.name}</p>
            <p className="text-fg-dim text-[0.6rem] tracking-wider">
              {npc.nameEn}
            </p>
          </div>
        </div>

        <div className="border-l-2 border-resonance/40 pl-3 mb-5">
          <p className="text-fg-primary text-sm leading-relaxed display-text">
            {response ?? npc.firstLine}
          </p>
        </div>

        <p className="text-fg-dim text-[0.6rem] tracking-[0.3em] uppercase mb-2">
          물을 수 있는 것
        </p>
        <div className="space-y-2 mb-4">
          {npc.topics.map((t, i) => (
            <button
              key={i}
              onClick={() => onPickTopic(t.response)}
              className="w-full text-left text-xs px-3 py-2 border border-bg-elevated/60
                         rounded-sm bg-bg-elevated/30 text-fg-muted
                         hover:border-resonance/40 hover:text-fg-primary
                         active:scale-[0.99] transition-all"
            >
              — {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 text-fg-dim text-xs hover:text-fg-muted transition-colors"
        >
          자리에서 일어난다
        </button>

        <p className="text-fg-dim text-[0.6rem] italic mt-3 text-center">
          Phase 1+: LLM 동적 대화 + Nano Banana 이미지
        </p>
      </div>
    </div>
  );
}
