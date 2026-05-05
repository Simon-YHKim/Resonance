import { useEffect, useRef, useState } from 'react';

interface Props {
  /** AsyncIterable<string> — 토큰 단위 스트림 */
  stream: AsyncIterable<string>;
  /** 스트림 완료 시 콜백 */
  onComplete?: () => void;
  className?: string;
}

/** LLM 토큰 스트림을 점진적으로 렌더 — v2.4 §28.4 "응답 미리보기" UX */
export function StreamingText({ stream, onComplete, className }: Props) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    setText('');
    setDone(false);

    (async () => {
      let buf = '';
      for await (const chunk of stream) {
        if (cancelled.current) return;
        buf += chunk;
        setText(buf);
      }
      if (!cancelled.current) {
        setDone(true);
        onComplete?.();
      }
    })();

    return () => {
      cancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  return (
    <p className={className}>
      {text}
      {!done && <span className="inline-block w-[0.5em] animate-breathe text-resonance">▍</span>}
    </p>
  );
}
