/**
 * Worker API client — apps/web, apps/mobile 공유.
 *
 * Phase 1 endpoints:
 *   POST /api/character/analyze
 *   GET  /api/character/wiki
 *
 * 인증: Phase 1 은 X-Dev-User-Id 헤더 placeholder.
 *      Phase 1.5 에 Authorization: Bearer <Clerk JWT> 로 교체.
 */

import { NicknameAnalysisSchema, type NicknameAnalysis } from '../schemas/nickname-analysis';
import type { UserWiki } from '../types';

export interface ResonanceClientConfig {
  /** Worker base URL (예: http://localhost:8787 또는 https://resonance-worker.<account>.workers.dev) */
  baseUrl: string;
  /** Phase 1 placeholder. Phase 1.5+ 에서 getToken() 교체. */
  devUserId?: string;
  /** Phase 1.5+ — Clerk JWT 등 */
  authToken?: string;
  /** fetch 주입 (테스트 friendly) */
  fetch?: typeof fetch;
}

export class ResonanceApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
    public readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'ResonanceApiError';
  }
}

interface ApiErrorBody {
  success: false;
  error: string;
  code: string;
  retry_after_ms?: number;
}

interface AnalyzeSuccessBody {
  success: true;
  user_wiki: { user_id: string; nickname_analysis: NicknameAnalysis };
  meta: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
}

interface WikiSuccessBody {
  success: true;
  user_wiki: UserWiki;
}

export class ResonanceClient {
  constructor(private readonly config: ResonanceClientConfig) {}

  private get fetch(): typeof fetch {
    return this.config.fetch ?? globalThis.fetch;
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.devUserId) h['X-Dev-User-Id'] = this.config.devUserId;
    if (this.config.authToken) h.Authorization = `Bearer ${this.config.authToken}`;
    return h;
  }

  /** 닉네임 분석 + user_wiki 저장 */
  async analyzeNickname(nickname: string): Promise<AnalyzeSuccessBody> {
    const res = await this.fetch(`${this.config.baseUrl}/api/character/analyze`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ nickname }),
    });
    return await this.parseJson<AnalyzeSuccessBody>(res);
  }

  /** 현재 사용자 wiki 조회 */
  async getWiki(): Promise<WikiSuccessBody> {
    const res = await this.fetch(`${this.config.baseUrl}/api/character/wiki`, {
      method: 'GET',
      headers: this.headers,
    });
    return await this.parseJson<WikiSuccessBody>(res);
  }

  /** 헬스 체크 */
  async health(): Promise<{ name: string; phase: number; status: string; endpoints: string[] }> {
    const res = await this.fetch(`${this.config.baseUrl}/api/health`);
    if (!res.ok) {
      throw new ResonanceApiError('HEALTH_DOWN', `health check ${res.status}`, res.status);
    }
    return (await res.json()) as {
      name: string;
      phase: number;
      status: string;
      endpoints: string[];
    };
  }

  private async parseJson<T>(res: Response): Promise<T> {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new ResonanceApiError('INVALID_RESPONSE', 'JSON 파싱 실패', res.status);
    }
    if (!res.ok) {
      const err = body as ApiErrorBody;
      throw new ResonanceApiError(
        err.code ?? 'SERVER_ERROR',
        err.error ?? '알 수 없는 오류',
        res.status,
        err.retry_after_ms,
      );
    }
    return body as T;
  }
}

/** Helper: analyze 응답에서 nickname_analysis 만 추출 + 검증 */
export function validateAnalyze(body: AnalyzeSuccessBody): NicknameAnalysis {
  return NicknameAnalysisSchema.parse(body.user_wiki.nickname_analysis);
}
