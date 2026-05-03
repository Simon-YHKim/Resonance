import { useEffect, useRef, useState } from 'react';
import { ActionButton } from '@/components/ActionButton';
import { StreamingText } from '@/components/StreamingText';
import { VoiceBubble } from '@/components/VoiceBubble';
import { mockLLM } from '@/services/llm/MockLLMService';
import { useGame } from '@/store/gameStore';

type Phase = 'classifying' | 'generating' | 'streaming' | 'done';

/** 스트림 헬퍼 — 캐릭터 생성 후 voiceFirstLine을 char 단위로 흘려보낸다 */
async function* streamLine(text: string, msPer = 40): AsyncGenerator<string, void, void> {
  for (const ch of text) {
    yield ch;
    await new Promise((r) => setTimeout(r, msPer));
  }
}

export function CharacterCreationScreen() {
  const goTo = useGame((s) => s.goTo);
  const setCharacter = useGame((s) => s.setCharacter);
  // 닉네임은 mount 시점에 한 번만 캡처 — setCharacter()가 store의
  // pendingNickname을 null로 리셋해도 진행 중 화면은 유지되도록.
  // (이전 회귀: setCharacter 호출 → store 변경 → 리렌더 → nickname=''
  //   → if(!nickname) fallback "이름을 다시" 화면으로 튀던 문제 fix)
  const [nickname] = useState(() => useGame.getState().pendingNickname ?? '');

  const [phase, setPhase] = useState<Phase>('classifying');
  const [streamGen, setStreamGen] = useState<AsyncGenerator<string> | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current || !nickname) return;
    ranRef.current = true;

    (async () => {
      const category = await mockLLM.classifyNickname(nickname);
      setPhase('generating');
      const sheet = await mockLLM.generateCharacter(nickname, category);
      setCharacter(sheet);
      setPhase('streaming');
      setStreamGen(streamLine(sheet.voiceFirstLine));
    })();
  }, [nickname, setCharacter]);

  if (!nickname) {
    return (
      <div className="vignette min-h-full flex items-center justify-center p-8">
        <ActionButton onClick={() => goTo('nicknameInput')}>이름을 다시</ActionButton>
      </div>
    );
  }

  return (
    <div className="vignette min-h-full flex flex-col px-8 py-12 game-ui">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center">
        <p className="text-fg-dim text-xs tracking-[0.3em] uppercase text-center mb-3">
          {phase === 'classifying' && '… 이름의 무게를 듣는다'}
          {phase === 'generating' && '… 잔향이 자리를 만든다'}
          {phase === 'streaming' && '잔향이 응답한다'}
          {phase === 'done' && ''}
        </p>

        {phase !== 'streaming' && phase !== 'done' && (
          <div className="flex justify-center my-12">
            <div className="w-3 h-3 rounded-full bg-resonance animate-breathe" />
          </div>
        )}

        {streamGen && (
          <VoiceBubble speaker="voice">
            <StreamingText
              stream={streamGen}
              onComplete={() => setPhase('done')}
            />
          </VoiceBubble>
        )}
      </div>

      <div className="max-w-sm w-full mx-auto">
        <ActionButton
          disabled={phase !== 'done'}
          onClick={() => goTo('hearth')}
        >
          {phase === 'done' ? '기억의 향로로' : '…'}
        </ActionButton>
      </div>
    </div>
  );
}
