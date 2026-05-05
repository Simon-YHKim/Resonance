/**
 * Gemini Flash-Lite 닉네임 분석기 (REST API 직접 호출).
 *
 * Workers 환경 호환 — SDK 없이 fetch 만 사용.
 *
 * paid-api-guard:
 *   - GEMINI_API_KEY 는 .dev.vars / wrangler secret put
 *   - 채팅·로그에 키 노출 X (사용자 환경에만)
 *
 * Refs: https://ai.google.dev/api/generate-content
 */

import {
  NicknameAnalysisSchema,
  type NicknameAnalysis,
} from '@resonance/shared';
import { LLMError } from './nickname-analyzer';

// 가격 (per 1M tokens, USD) — 2026.05 시안. Gemini 2.5 Flash-Lite.
const GEMINI_INPUT_USD_PER_M = 0.1;
const GEMINI_OUTPUT_USD_PER_M = 0.4;

export function calcGeminiCost(input: number, output: number): number {
  return (input * GEMINI_INPUT_USD_PER_M + output * GEMINI_OUTPUT_USD_PER_M) / 1_000_000;
}

interface GenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string; code?: number };
}

export interface GeminiAnalyzeResult {
  analysis: NicknameAnalysis;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface GeminiCallOptions {
  /** fetch 주입 (테스트 friendly) */
  fetch?: typeof fetch;
  /** 모델 override. default: gemini-flash-lite-latest */
  model?: string;
}

/**
 * Gemini Flash-Lite 로 닉네임 분석.
 *
 * @param cleaned   validateNickname() 통과한 trimmed nickname
 * @param systemPrompt  닉네임 분석가 시스템 프롬프트
 * @param apiKey    GEMINI_API_KEY
 * @param options   model override / fetch 주입
 */
export async function analyzeWithGemini(
  cleaned: string,
  systemPrompt: string,
  apiKey: string,
  options: GeminiCallOptions = {},
): Promise<GeminiAnalyzeResult> {
  const model = options.model ?? 'gemini-flash-lite-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const fetchFn = options.fetch ?? globalThis.fetch;

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Gemini: system instructions 전용 필드
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: `닉네임: "${cleaned}"` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          // JSON 강제
          responseMimeType: 'application/json',
          maxOutputTokens: 1024,
        },
      }),
    });
  } catch (err) {
    throw new LLMError('Gemini 호출 네트워크 오류', err);
  }

  let body: GenerateContentResponse;
  try {
    body = (await response.json()) as GenerateContentResponse;
  } catch (err) {
    throw new LLMError('Gemini 응답 JSON 파싱 실패', err);
  }

  if (!response.ok || body.error) {
    const msg = body.error?.message ?? `HTTP ${response.status}`;
    throw new LLMError(`Gemini 응답 오류: ${msg}`);
  }

  const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) {
    throw new LLMError('Gemini 응답이 비어 있습니다.');
  }

  // JSON 파싱 (responseMimeType=application/json 이지만 markdown 감쌀 수도)
  let parsed: unknown;
  try {
    const cleaned_text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    parsed = JSON.parse(cleaned_text);
  } catch (err) {
    throw new LLMError('Gemini 응답 JSON 파싱 실패.', err);
  }

  const validated = NicknameAnalysisSchema.safeParse(parsed);
  if (!validated.success) {
    throw new LLMError(`Gemini 응답 스키마 위반: ${validated.error.message}`);
  }

  // 닉네임 강제 교정 (LLM 응답이 다를 수 있음)
  const analysis: NicknameAnalysis = { ...validated.data, nickname: cleaned };

  const inputTokens = body.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = body.usageMetadata?.candidatesTokenCount ?? 0;

  return {
    analysis,
    model,
    inputTokens,
    outputTokens,
    costUsd: calcGeminiCost(inputTokens, outputTokens),
  };
}
