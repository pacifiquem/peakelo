import { describe, expect, it } from 'vitest';

import {
  clusterBySkeleton,
  pawnSkeleton,
  samePawnStructure,
  structureLabel,
} from '../src/pass/structures';

const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const e4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const e4Wing = 'rnbqkbnr/pppppppp/8/8/4P3/8/1PPP1PPP/RNBQKBNR b KQkq - 0 1';
const sicilian = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
const openGame = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
const iqp = 'rnbqkbnr/pp3ppp/8/3p4/3P4/8/PP3PPP/RNBQKBNR w KQkq - 0 5';

describe('pawn structure similarity', () => {
  it('groups a wing pawn trade with the same center', () => {
    const left = pawnSkeleton(e4);
    const right = pawnSkeleton(e4Wing);
    expect(left && right && samePawnStructure(left, right)).toBe(true);
  });

  it('does not group a different central pawn', () => {
    const left = pawnSkeleton(sicilian);
    const right = pawnSkeleton(openGame);
    expect(left && right && samePawnStructure(left, right)).toBe(false);
  });

  it('names an isolated pawn from the Chess.com definition', () => {
    const skeleton = pawnSkeleton(iqp);
    expect(skeleton && structureLabel(skeleton)).toContain('Black isolated pawn on d5');
  });

  it('clusters only close skeletons', () => {
    const groups = clusterBySkeleton(
      [
        { id: 'a', fen: e4 },
        { id: 'b', fen: e4Wing },
        { id: 'c', fen: sicilian },
      ],
      (item) => pawnSkeleton(item.fen) ?? pawnSkeleton(start)!,
    );
    expect(groups.map((group) => group.map((item) => item.id))).toEqual([['a', 'b'], ['c']]);
  });
});
