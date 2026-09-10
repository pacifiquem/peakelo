import { describe, expect, it } from 'vitest';
import { cplFromScores, judgmentFromCpl } from '../src/eval';

describe('cplFromScores', () => {
  it('is the white-side drop when white moves', () => {
    expect(cplFromScores({ kind: 'cp', value: 50 }, { kind: 'cp', value: 0 }, 'white')).toBe(50);
  });

  it('is the black-side drop when black moves', () => {
    expect(cplFromScores({ kind: 'cp', value: -80 }, { kind: 'cp', value: 0 }, 'black')).toBe(80);
  });

  it('is zero when the scores are equal', () => {
    expect(cplFromScores({ kind: 'cp', value: 12 }, { kind: 'cp', value: 12 }, 'white')).toBe(0);
    expect(cplFromScores({ kind: 'cp', value: -4 }, { kind: 'cp', value: -4 }, 'black')).toBe(0);
  });

  it('does not go negative when the played line is better', () => {
    expect(cplFromScores({ kind: 'cp', value: 10 }, { kind: 'cp', value: 40 }, 'white')).toBe(0);
  });
});

describe('judgmentFromCpl', () => {
  it('uses the documented centipawn cuts', () => {
    expect(judgmentFromCpl(0)).toBe('best');
    expect(judgmentFromCpl(10)).toBe('best');
    expect(judgmentFromCpl(11)).toBe('good');
    expect(judgmentFromCpl(49)).toBe('good');
    expect(judgmentFromCpl(50)).toBe('inaccuracy');
    expect(judgmentFromCpl(99)).toBe('inaccuracy');
    expect(judgmentFromCpl(100)).toBe('mistake');
    expect(judgmentFromCpl(299)).toBe('mistake');
    expect(judgmentFromCpl(300)).toBe('blunder');
  });
});
