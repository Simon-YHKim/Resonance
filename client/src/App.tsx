import { useGame } from '@/store/gameStore';
import { TitleScreen } from '@/screens/TitleScreen';
import { NicknameInputScreen } from '@/screens/NicknameInputScreen';
import { CharacterCreationScreen } from '@/screens/CharacterCreationScreen';
import { CharacterSheetScreen } from '@/screens/CharacterSheetScreen';
import { CombatScreen } from '@/screens/CombatScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { DebugPanel, isDebugMode } from '@/components/DebugPanel';
import type { Screen } from '@/types/game';

const SCREENS: Record<Screen, () => JSX.Element | null> = {
  title: TitleScreen,
  nicknameInput: NicknameInputScreen,
  characterCreation: CharacterCreationScreen,
  characterSheet: CharacterSheetScreen,
  combat: CombatScreen,
  result: ResultScreen,
};

export function App() {
  const screen = useGame((s) => s.screen);
  const Current = SCREENS[screen];
  const debug = isDebugMode();
  return (
    <>
      <main className="h-full w-full max-w-md mx-auto" key={screen}>
        <Current />
      </main>
      {debug && <DebugPanel />}
    </>
  );
}
