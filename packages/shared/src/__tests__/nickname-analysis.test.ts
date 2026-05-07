import { describe, it, expect } from 'vitest';
import {
  NicknameAnalysisSchema,
  type NicknameAnalysis,
} from '../schemas/nickname-analysis';

const sample: NicknameAnalysis = {
  nickname: '회사다니기싫은김대리',
  the_Voice_호칭: '김 대리님',
  description:
    '강남역 출근길 끝, 잿빛 외투를 걸친 그림자가 멈춰 선다. 회사·회식·발표가 한 사람의 결을 깎아 내린 자리.',
  safety_concern: 'none',
  추정직업: '직장인',
  추정연령: '30대',
  주요키워드: ['회사', '김대리', '출근'],
};

describe('NicknameAnalysisSchema (자유 분석 모드)', () => {
  it('정상 데이터 통과', () => {
    expect(NicknameAnalysisSchema.safeParse(sample).success).toBe(true);
  });

  it('필수 필드만 (the_Voice_호칭 + description + safety_concern + nickname) 통과', () => {
    const minimal: NicknameAnalysis = {
      nickname: '바람',
      the_Voice_호칭: '바람의 너',
      description: '거리 끝에서 흘러가는 결.',
      safety_concern: 'none',
    };
    expect(NicknameAnalysisSchema.safeParse(minimal).success).toBe(true);
  });

  it('description 비어있음 → 실패', () => {
    const bad = { ...sample, description: '' };
    expect(NicknameAnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it('description 801자 → 실패', () => {
    const bad = { ...sample, description: 'a'.repeat(801) };
    expect(NicknameAnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it('safety_concern 잘못된 값 → 실패', () => {
    const bad = { ...sample, safety_concern: 'medium' as never };
    expect(NicknameAnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it('safety_concern=high 통과', () => {
    const high = { ...sample, safety_concern: 'high' as const };
    expect(NicknameAnalysisSchema.safeParse(high).success).toBe(true);
  });

  it('주요키워드 11개 → 실패 (max 10)', () => {
    const bad = { ...sample, 주요키워드: Array(11).fill('a') };
    expect(NicknameAnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it('닉네임 21자 → 실패', () => {
    const bad = { ...sample, nickname: '가'.repeat(21) };
    expect(NicknameAnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it('스토리매칭 누락 OK (선택 필드)', () => {
    const without = { ...sample };
    delete (without as Partial<NicknameAnalysis>).스토리매칭;
    expect(NicknameAnalysisSchema.safeParse(without).success).toBe(true);
  });

  it('카테고리 필드는 더 이상 필요 없음 (자유 분석)', () => {
    // 사용자 결정: 모든 검열·필터·카테고리 제거.
    // 사이즈만 product 결정, 내용은 LLM 자율.
    const r = NicknameAnalysisSchema.safeParse(sample);
    if (r.success) {
      // category 필드는 정의되지 않음
      expect((r.data as { category?: string }).category).toBeUndefined();
    }
  });
});
