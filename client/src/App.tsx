import { useGame } from '@/store/gameStore';
import { TitleScreen } from '@/screens/TitleScreen';
import { NicknameInputScreen } from '@/screens/NicknameInputScreen';
import { CharacterCreationScreen } from '@/screens/CharacterCreationScreen';
import { HearthScreen } from '@/screens/HearthScreen';
import { CharacterSheetScreen } from '@/screens/CharacterSheetScreen';
import { MapScreen } from '@/screens/MapScreen';
import { NPCScreen } from '@/screens/NPCScreen';
import { ShopScreen } from '@/screens/ShopScreen';
import { BestiaryScreen } from '@/screens/BestiaryScreen';
import { CombatScreen } from '@/screens/CombatScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { DebugPanel, isDebugMode } from '@/components/DebugPanel';
import type { Screen } from '@/types/game';

const SCREENS: Record<Screen, () => JSX.Element | null> = {
  title: TitleScreen,
  nicknameInput: NicknameInputScreen,
  characterCreation: CharacterCreationScreen,
  hearth: HearthScreen,
  characterSheet: CharacterSheetScreen,
  map: MapScreen,
  npc: NPCScreen,
  shop: ShopScreen,
  bestiary: BestiaryScreen,
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
