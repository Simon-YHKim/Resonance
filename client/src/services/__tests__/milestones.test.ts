import { describe, expect, it } from 'vitest';
import { crossedMilestone } from '../milestones';

describe('crossedMilestone', () => {
  it('returns null when no milestone is crossed', () => {
    expect(crossedMilestone(0, 50)).toBeNull();
    expect(crossedMilestone(110, 150)).toBeNull();
    expect(crossedMilestone(550, 700)).toBeNull();
  });

  it('returns null when value decreases or stays same', () => {
    expect(crossedMilestone(150, 90)).toBeNull();
    expect(crossedMilestone(100, 100)).toBeNull();
  });

  it('returns the milestone when crossing single threshold', () => {
    const m = crossedMilestone(95, 105);
    expect(m?.threshold).toBe(100);
    expect(m?.message).toContain('백');
  });

  it('returns the highest milestone when crossing multiple at once', () => {
    // 95 → 305 crosses 100, 200, 300 — should return 300
    const m = crossedMilestone(95, 305);
    expect(m?.threshold).toBe(300);
  });

  it('handles tier-aligned thresholds correctly (50/150/400/1000 are NOT milestones)', () => {
    // tier 임계 = 50: 마일스톤 X (중복 방지)
    expect(crossedMilestone(45, 55)).toBeNull();
    // tier 임계 = 150: 마일스톤 X
    expect(crossedMilestone(145, 155)).toBeNull();
    // 100 is a milestone (tier echo는 50, resonant는 150)
    expect(crossedMilestone(99, 100)?.threshold).toBe(100);
  });

  it('returns null when crossing from 0 to milestone exactly', () => {
    // before < 100 && after >= 100 만족
    expect(crossedMilestone(0, 100)?.threshold).toBe(100);
  });

  it('all milestone messages are non-empty', () => {
    const cases = [99, 199, 299, 499, 749, 1499, 1999];
    for (const before of cases) {
      const m = crossedMilestone(before, before + 5);
      expect(m).not.toBeNull();
      expect(m?.message.length).toBeGreaterThan(0);
    }
  });
});
