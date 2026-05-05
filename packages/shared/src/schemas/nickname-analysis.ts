/**
 * NicknameAnalysisSchema — 닉네임 분석 LLM 응답 검증.
 *
 * 옵션 4-C: wire format 한국어 키 (잔향 정체성 유지),
 * TypeScript 코드 내부는 NicknameAnalysisAlias 영문 alias 인터페이스 사용.
 *
 * 11카테고리 enum / 5체 보스 자리 / the Voice 호칭 모두 검증.
 *
 * Refs: 잔향_시스템명세_v1.4.md §2.1.1
 */

import { z } from 'zod';

// 닉네임 카테고리 (8종 — A·B·C·D·E·F·G·H)
export const NicknameCategorySchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
export type NicknameCategory = z.infer<typeof NicknameCategorySchema>;

// 스토리 매칭 — 5체 보스 자리 + 회상
export const StoryMatchingSchema = z.object({
  보스1자리: z.string().min(1),
  보스1회상: z.string().min(1),
  보스2자리: z.string().min(1),
  보스3자리: z.string().min(1),
  보스4자리: z.string().min(1),
  보스5자리: z.string().min(1),
});

// 거점 NPC 말투 — 자유 키
export const NpcSpeechSchema = z.record(z.string(), z.string());

// 닉네임 분석 전체 스키마 (LLM 응답 = 이 모양)
export const NicknameAnalysisSchema = z.object({
  nickname: z.string().min(1).max(20),
  category: NicknameCategorySchema,
  추정직업: z.string().min(1),
  추정연령: z.string().min(1),
  추정환경: z.string().min(1),
  정서적결: z.string().min(1),
  주요키워드: z.array(z.string().min(1)).min(1).max(10),
  스토리매칭: StoryMatchingSchema,
  거점NPC말투: NpcSpeechSchema,
  the_Voice_호칭: z.string().min(1),
});

export type NicknameAnalysis = z.infer<typeof NicknameAnalysisSchema>;

/**
 * 영문 alias — TS 코드 내부 작업 친화.
 * runtime 변환은 toAlias() / fromAlias() 헬퍼 사용.
 */
export interface NicknameAnalysisAlias {
  nickname: string;
  category: NicknameCategory;
  occupation: string;
  ageBand: string;
  environment: string;
  mood: string;
  keywords: string[];
  storyMatching: {
    boss1Place: string;
    boss1Memory: string;
    boss2Place: string;
    boss3Place: string;
    boss4Place: string;
    boss5Place: string;
  };
  npcSpeech: Record<string, string>;
  voiceAddress: string;
}

export function toAlias(a: NicknameAnalysis): NicknameAnalysisAlias {
  return {
    nickname: a.nickname,
    category: a.category,
    occupation: a.추정직업,
    ageBand: a.추정연령,
    environment: a.추정환경,
    mood: a.정서적결,
    keywords: a.주요키워드,
    storyMatching: {
      boss1Place: a.스토리매칭.보스1자리,
      boss1Memory: a.스토리매칭.보스1회상,
      boss2Place: a.스토리매칭.보스2자리,
      boss3Place: a.스토리매칭.보스3자리,
      boss4Place: a.스토리매칭.보스4자리,
      boss5Place: a.스토리매칭.보스5자리,
    },
    npcSpeech: a.거점NPC말투,
    voiceAddress: a.the_Voice_호칭,
  };
}

export function fromAlias(a: NicknameAnalysisAlias): NicknameAnalysis {
  return {
    nickname: a.nickname,
    category: a.category,
    추정직업: a.occupation,
    추정연령: a.ageBand,
    추정환경: a.environment,
    정서적결: a.mood,
    주요키워드: a.keywords,
    스토리매칭: {
      보스1자리: a.storyMatching.boss1Place,
      보스1회상: a.storyMatching.boss1Memory,
      보스2자리: a.storyMatching.boss2Place,
      보스3자리: a.storyMatching.boss3Place,
      보스4자리: a.storyMatching.boss4Place,
      보스5자리: a.storyMatching.boss5Place,
    },
    거점NPC말투: a.npcSpeech,
    the_Voice_호칭: a.voiceAddress,
  };
}
