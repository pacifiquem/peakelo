import { describe, expect, it } from 'vitest';
import { courseSkillBand, parseEloValue } from '../src/rating';

describe('parseEloValue', () => {
  it('accepts a platform rating and rejects junk', () => {
    expect(parseEloValue(1842)).toBe(1842);
    expect(parseEloValue('1500')).toBe(1500);
    expect(parseEloValue('?')).toBeNull();
    expect(parseEloValue(0)).toBeNull();
    expect(parseEloValue(-3)).toBeNull();
  });
});

describe('courseSkillBand', () => {
  it('uses Chess.com published course skill ranges', () => {
    expect(courseSkillBand(200)).toBe('under400');
    expect(courseSkillBand(400)).toBe('from400to1200');
    expect(courseSkillBand(1199)).toBe('from400to1200');
    expect(courseSkillBand(1200)).toBe('from1200to1600');
    expect(courseSkillBand(1600)).toBe('from1600to2000');
    expect(courseSkillBand(2000)).toBe('over2000');
  });
});
