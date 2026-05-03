import { Component, type ErrorInfo, type ReactNode } from 'react';

/* React Error Boundary — 잔향 톤의 fallback.
 * 자식 트리에서 던진 에러를 잡아 앱 전체 크래시(흰 화면) 방지.
 *
 * Phase 0: 단순 reset 버튼만. Phase 1+에서 Cloudflare Workers
 * 텔레메트리 endpoint(/api/error)로 stack 보고. */

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // console.error는 lint 룰 allow 목록에 포함됨
    console.error('[잔향 ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  private handleHardReset = () => {
    try {
      localStorage.removeItem('resonance:game');
    } catch {
      /* storage 차단 시 무시 */
    }
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="vignette min-h-full flex flex-col items-center justify-center px-8 py-12 game-ui max-w-md mx-auto">
        <p className="text-fg-dim text-xs tracking-[0.3em] uppercase mb-3">
          잔향이 흐트러졌다
        </p>
        <h2 className="display-text text-2xl text-fg-primary mb-6 text-center">
          여기서 잠시, 멈춤.
        </h2>
        <p className="text-fg-muted text-sm text-center leading-relaxed mb-8 max-w-xs">
          무언가가 잔향의 결을 흔들었다. 한 박자 쉬고, 다시 시작한다.
        </p>

        <button
          type="button"
          onClick={this.handleReset}
          className="w-full max-w-xs px-6 py-3 mb-3 border border-resonance/50 text-resonance display-text text-sm hover:bg-resonance/10 transition-colors"
        >
          다시 잔향으로
        </button>
        <button
          type="button"
          onClick={this.handleHardReset}
          className="text-fg-dim text-xs tracking-[0.2em] uppercase py-2 hover:text-fg-muted transition-colors"
        >
          처음부터 다시
        </button>

        <details className="mt-12 text-fg-dim text-xs max-w-xs w-full">
          <summary className="cursor-pointer">기술 정보</summary>
          <pre className="mt-2 text-[0.65rem] whitespace-pre-wrap break-all opacity-70">
            {error.name}: {error.message}
          </pre>
        </details>
      </div>
    );
  }
}
