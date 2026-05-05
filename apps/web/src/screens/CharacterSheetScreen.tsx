import { ActionButton } from '@/components/ActionButton';
import { useGame } from '@/store/gameStore';
import { FORGETTER_OF_CHILDHOOD } from '@/services/llm/mockData/combatNarrations';

export function CharacterSheetScreen() {
  const character = useGame((s) => s.character);
  const goTo = useGame((s) => s.goTo);
  const startCombat = useGame((s) => s.startCombat);

  if (!character) {
    return (
      <div className="vignette min-h-full flex items-center justify-center p-8">
        <ActionButton onClick={() => goTo('title')}>처음으로</ActionButton>
      </div>
    );
  }

  const handleEnterCombat = () => {
    startCombat({
      player: { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100 },
      enemy: {
        name: FORGETTER_OF_CHILDHOOD.name,
        description: FORGETTER_OF_CHILDHOOD.description,
        hp: FORGETTER_OF_CHILDHOOD.hp,
        maxHp: FORGETTER_OF_CHILDHOOD.hp,
      },
      turn: 0,
      resonance: 0,
    });
    goTo('combat');
  };

  return (
    <div className="vignette min-h-full flex flex-col px-8 py-10 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 overflow-y-auto pb-6">
        <p className="text-fg-dim text-xs tracking-[0.3em] uppercase mb-2">이름을 가진 자</p>
        <h2 className="display-text text-3xl text-fg-primary mb-1">{character.nickname}</h2>
        <p className="text-resonance text-sm display-text mb-8">— {character.startingClass}</p>

        <Section label="잔향이 본 너">
          <p className="text-fg-primary leading-relaxed">{character.characterConcept}</p>
        </Section>

        <Section label="외형">
          <p className="text-fg-muted leading-relaxed text-sm">{character.appearance}</p>
        </Section>

        <Section label="연결된 키워드">
          <div className="flex flex-wrap gap-2">
            {character.linkedKeywords.map((k) => (
              <span
                key={k}
                className="px-3 py-1 text-xs border border-resonance/40 text-resonance rounded-sm"
              >
                {k}
              </span>
            ))}
          </div>
        </Section>
      </div>

      <div className="max-w-sm w-full mx-auto space-y-3">
        <ActionButton onClick={handleEnterCombat}>원의 자리로</ActionButton>
        <ActionButton variant="subtle" onClick={() => goTo('title')}>
          ← 처음으로
        </ActionButton>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 animate-fade-in">
      <div className="text-fg-dim text-[0.65rem] tracking-[0.2em] uppercase mb-2">{label}</div>
      {children}
    </div>
  );
}
