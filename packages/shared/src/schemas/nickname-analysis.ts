/**
 * NicknameAnalysisSchema — 닉네임 분석 LLM 응답 검증.
 *
 * 자유 분석 모드 (Phase 1.6+):
 *   - category 강제 X (LLM 자유 분석)
 *   - 모든 분석 필드 OPTIONAL — LLM이 적절히 채움
 *   - safety_concern 만 필수 (자살예방법 §27조의8 — 1393 안내 트리거)
 *   - the_Voice_호칭 필수 (UI 첫 줄에 노출되는 정체성)
 *   - 자유 텍스트 description 필수 (LLM 다층 묘사)
 *
 * 사이즈는 product 결정, 내용은 LLM 자율.
 *
 * Refs: 잔향_시스템명세_v1.4.md §2.1.1 + 자살예방법 §27조의8
 */

import { z } from 'zod';
import { StatsSchema } from './combat';

// 자살예방법 §27조의8 안전 트리거 — 앱이 'high' 받으면 1393 안내 모달
export const SafetyConcernSchema = z.enum(['none', 'high']);
export type SafetyConcern = z.infer<typeof SafetyConcernSchema>;

/**
 * 자유 분석 schema.
 *
 * - LLM 이 닉네임에서 추출한 다층 정체성을 자유 텍스트로 서술.
 * - 키워드·정서·연령·환경 등 부가 정보는 OPTIONAL — LLM 이 적절히 채움.
 * - 스토리매칭(5체 보스 자리)·NPC 말투는 LLM 자율 — 제공되면 UI 활용, 없어도 동작.
 *
 * Wire format: 한국어 키 유지 (잔향 정체성).
 */
export const NicknameAnalysisSchema = z.object({
  nickname: z.string().min(1).max(20),

  // 핵심 (필수)
  the_Voice_호칭: z.string().min(1).max(40),
  description: z.string().min(1).max(800),
  safety_concern: SafetyConcernSchema,

  // 5 스탯 (디아블로식, 1~20) — LLM이 닉네임 결에 맞춰 자동 분배
  stats: StatsSchema.optional(),

  // 부가 (선택 — LLM 자유 채움)
  추정직업: z.string().max(40).optional(),
  추정연령: z.string().max(20).optional(),
  추정환경: z.string().max(40).optional(),
  정서적결: z.string().max(40).optional(),
  주요키워드: z.array(z.string().min(1).max(20)).max(10).optional(),
  스토리매칭: z
    .object({
      보스1자리: z.string().max(80).optional(),
      보스1회상: z.string().max(120).optional(),
      보스2자리: z.string().max(80).optional(),
      보스3자리: z.string().max(80).optional(),
      보스4자리: z.string().max(80).optional(),
      보스5자리: z.string().max(80).optional(),
    })
    .optional(),
  거점NPC말투: z.record(z.string(), z.string().max(200)).optional(),
});

export type NicknameAnalysis = z.infer<typeof NicknameAnalysisSchema>;
