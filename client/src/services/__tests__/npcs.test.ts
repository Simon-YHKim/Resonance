import { describe, expect, it } from 'vitest';
import { NPCS, colorForMood, findNPC } from '../npcs';

describe('NPCS', () => {
  it('has 4 NPCs with required fields', () => {
    expect(NPCS).toHaveLength(4);
    for (const npc of NPCS) {
      expect(npc.id.length).toBeGreaterThan(0);
      expect(npc.name.length).toBeGreaterThan(0);
      expect(npc.nameEn.length).toBeGreaterThan(0);
      expect(npc.role.length).toBeGreaterThan(0);
      expect(npc.personality.length).toBeGreaterThan(0);
      expect(npc.firstLine.length).toBeGreaterThan(0);
      expect(npc.topics.length).toBeGreaterThanOrEqual(3);
      expect(npc.avatarSymbol.length).toBeGreaterThan(0);
      expect(npc.imageUrl).toBeNull(); // Phase 0
    }
  });

  it('all 4 NPC ids are unique', () => {
    const ids = new Set(NPCS.map((n) => n.id));
    expect(ids.size).toBe(4);
  });

  it('all topics have label + response', () => {
    for (const npc of NPCS) {
      for (const t of npc.topics) {
        expect(t.label.length).toBeGreaterThan(0);
        expect(t.response.length).toBeGreaterThan(0);
      }
    }
  });

  it('NPC names match design (4 personality types)', () => {
    const names = NPCS.map((n) => n.name);
    expect(names).toContain('시장의 노파');
    expect(names).toContain('거리의 음유시인');
    expect(names).toContain('한 번도 본 적 없던 친구');
    expect(names).toContain('잊혀진 자');
  });
});

describe('findNPC', () => {
  it('returns NPC by id', () => {
    expect(findNPC('market-elder')?.name).toBe('시장의 노파');
    expect(findNPC('street-bard')?.name).toBe('거리의 음유시인');
  });

  it('returns null for unknown id', () => {
    expect(findNPC('unknown')).toBeNull();
    expect(findNPC('')).toBeNull();
  });
});

describe('colorForMood', () => {
  it('returns Tailwind class for each mood', () => {
    expect(colorForMood('warm')).toContain('text-');
    expect(colorForMood('distant')).toContain('text-');
    expect(colorForMood('familiar')).toContain('text-');
    expect(colorForMood('silent')).toContain('text-');
  });

  it('4 moods produce 4 distinct colors', () => {
    const colors = new Set([
      colorForMood('warm'),
      colorForMood('distant'),
      colorForMood('familiar'),
      colorForMood('silent'),
    ]);
    expect(colors.size).toBe(4);
  });
});
