import { describe, it, expect } from 'vitest';
import {
  buildSystemPromptWithWiki,
  UserWikiContext,
} from '../wiki-injection';

const baseWiki: UserWikiContext = {
  userId: 'user_test',
  analysis: {
    nickname: '회사다니기싫은김대리',
    the_Voice_호칭: '김 대리님',
    description: '강남역 출근길 끝, 잿빛 외투를 걸친 그림자가 멈춰 선다.',
    safety_concern: 'none',
    추정직업: '직장인',
    추정연령: '30대',
    추정환경: '사무실',
    정서적결: '지친',
    주요키워드: ['회사', '김대리', '출근'],
  },
  recentMilestones: [],
  dominantAxis: null,
  axisLockedAt: null,
};

describe('buildSystemPromptWithWiki', () => {
  it('기본 — base prompt + 컨텍스트 블록', () => {
    const prompt = buildSystemPromptWithWiki(baseWiki, 'You are the Voice.');
    expect(prompt).toContain('You are the Voice.');
    expect(prompt).toContain('회사다니기싫은김대리');
    expect(prompt).toContain('직장인');
    expect(prompt).toContain('30대');
    expect(prompt).toContain('김 대리님');
  });

  it('이정표 비어있을 때 (없음) 표시', () => {
    const prompt = buildSystemPromptWithWiki(baseWiki, 'base');
    expect(prompt).toMatch(/\[최근 이정표\]\s*\n\(없음\)/);
  });

  it('이정표 있을 때 - 표기 (최근 3개)', () => {
    const wiki = {
      ...baseWiki,
      recentMilestones: [
        { event: '보스 1 처치', ts: 1 },
        { event: '보스 2 처치', ts: 2 },
        { event: '보스 3 처치', ts: 3 },
      ],
    };
    const prompt = buildSystemPromptWithWiki(wiki, 'base');
    expect(prompt).toContain('- 보스 1 처치');
    expect(prompt).toContain('- 보스 2 처치');
    expect(prompt).toContain('- 보스 3 처치');
  });

  it('우세 축 미결정 → (미결정)', () => {
    const prompt = buildSystemPromptWithWiki(baseWiki, 'base');
    expect(prompt).toContain('(미결정)');
  });

  it('우세 축 gaehwa → 개화 (도약형)', () => {
    const wiki = { ...baseWiki, dominantAxis: 'gaehwa' as const, axisLockedAt: 1 };
    expect(buildSystemPromptWithWiki(wiki, 'base')).toContain('개화 (도약형)');
  });

  it('우세 축 yeojeon → 여전 (수용형)', () => {
    const wiki = { ...baseWiki, dominantAxis: 'yeojeon' as const, axisLockedAt: 1 };
    expect(buildSystemPromptWithWiki(wiki, 'base')).toContain('여전 (수용형)');
  });

  it('우세 축 hangno → 항로 (절충형)', () => {
    const wiki = { ...baseWiki, dominantAxis: 'hangno' as const, axisLockedAt: 1 };
    expect(buildSystemPromptWithWiki(wiki, 'base')).toContain('항로 (절충형)');
  });

  it('안전 가이드라인 항상 포함 (자살예방법 + 미성년자)', () => {
    const prompt = buildSystemPromptWithWiki(baseWiki, 'base');
    expect(prompt).toContain('미성년자');
    expect(prompt).toContain('1393');
  });

  it('한국어 응답 강제', () => {
    const prompt = buildSystemPromptWithWiki(baseWiki, 'base');
    expect(prompt).toContain('한국어');
  });
});
