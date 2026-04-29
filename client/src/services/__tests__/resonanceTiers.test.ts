import { describe, expect, it } from 'vitest';
import { getTier } from '../resonanceTiers';

describe('getTier', () => {
  it('returns novice for 0 누적', () => {
    expect(getTier(0).tier).toBe('novice');
  });

  it('returns novice below 50', () => {
    expect(getTier(49).tier).toBe('novice');
  });

  it('returns echo from 50 to 149', () => {
    expect(getTier(50).tier).toBe('echo');
    expect(getTier(149).tier).toBe('echo');
  });

  it('returns resonant from 150 to 399', () => {
    expect(getTier(150).tier).toBe('resonant');
    expect(getTier(399).tier).toBe('resonant');
  });

  it('returns origin from 400+', () => {
    expect(getTier(400).tier).toBe('origin');
    expect(getTier(9999).tier).toBe('origin');
  });

  it('novice tier has no sheet/result messages', () => {
    const t = getTier(0);
    expect(t.sheetMessage).toBeUndefined();
    expect(t.resultFooter).toBeUndefined();
  });

  it('echo+ tiers have both sheet and result messages', () => {
    expect(getTier(50).sheetMessage).toBeTruthy();
    expect(getTier(50).resultFooter).toBeTruthy();
    expect(getTier(150).sheetMessage).toBeTruthy();
    expect(getTier(400).resultFooter).toBeTruthy();
  });
});
