import { describe, it, expect } from 'vitest';
import {
  NicknameAnalysisSchema,
  toAlias,
  fromAlias,
  type NicknameAnalysis,
} from '../schemas/nickname-analysis';

const sample: NicknameAnalysis = {
  nickname: '회사다니기싫은김대리',
  category: 'D',
  추정직업: '직장인',
  추정연령: '30대',
  추정환경: '사무실',
  정서적결: '지친',
  주요키워드: ['회사', '김대리', '출근'],
  스토리매칭: {
    보스1자리: '강남역 출근길',
    보스1회상: '회사 회식 자리',
    보스2자리: '한강 둔치',
    보스3자리: '학원가',
    보스4자리: '초등학교 골목',
    보스5자리: '회색 운동장',
  },
  거점NPC말투: { 차분한가게주인: '수고했어요. 김 대리님.' },
  the_Voice_호칭: '김 대리님',
};

describe('NicknameAnalysisSchema', () => {
  it('정상 데이터 통과', () => {
    expect(NicknameAnalysisSchema.safeParse(sample).success).toBe(true);
  });

  it('카테고리 X → 실패', () => {
    const bad = { ...sample, category: 'X' as never };
    expect(NicknameAnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it('주요키워드 빈 배열 → 실패', () => {
    const bad = { ...sample, 주요키워드: [] };
    expect(NicknameAnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it('주요키워드 11개 → 실패', () => {
    const bad = { ...sample, 주요키워드: Array(11).fill('a') };
    expect(NicknameAnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it('닉네임 21자 → 실패', () => {
    const bad = { ...sample, nickname: '가'.repeat(21) };
    expect(NicknameAnalysisSchema.safeParse(bad).success).toBe(false);
  });

  it('보스 자리 빈 문자열 → 실패', () => {
    const bad = {
      ...sample,
      스토리매칭: { ...sample.스토리매칭, 보스1자리: '' },
    };
    expect(NicknameAnalysisSchema.safeParse(bad).success).toBe(false);
  });
});

describe('toAlias / fromAlias roundtrip', () => {
  it('toAlias가 한국어 키 → 영문 키', () => {
    const a = toAlias(sample);
    expect(a.occupation).toBe('직장인');
    expect(a.ageBand).toBe('30대');
    expect(a.storyMatching.boss1Place).toBe('강남역 출근길');
    expect(a.voiceAddress).toBe('김 대리님');
  });

  it('fromAlias가 영문 키 → 한국어 키', () => {
    const a = toAlias(sample);
    const back = fromAlias(a);
    expect(back.추정직업).toBe('직장인');
    expect(back.스토리매칭.보스1자리).toBe('강남역 출근길');
    expect(back.the_Voice_호칭).toBe('김 대리님');
  });

  it('roundtrip 동일성 (deep equal)', () => {
    expect(fromAlias(toAlias(sample))).toEqual(sample);
  });
});
