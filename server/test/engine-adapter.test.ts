import { describe, expect, it } from 'vitest';
import { createFakeAdapter } from '../src/modules/engine';
import {
  parseBestmove,
  parseUciInfoLine,
  sideToMove,
  whitePositiveScore,
} from '../src/modules/engine/uci';

describe('UCI info parsing', () => {
  it('reads the last multipv line fields', () => {
    const line =
      'info depth 12 seldepth 18 multipv 2 score cp -34 nodes 100 pv e7e5 g1f3';
    expect(parseUciInfoLine(line)).toEqual({
      depth: 12,
      multipv: 2,
      score: { kind: 'cp', value: -34 },
      pvUci: ['e7e5', 'g1f3'],
    });
  });

  it('reads mate scores and defaults multipv to 1', () => {
    expect(parseUciInfoLine('info depth 8 score mate 3 pv h1h8')).toEqual({
      depth: 8,
      multipv: 1,
      score: { kind: 'mate', value: 3 },
      pvUci: ['h1h8'],
    });
  });

  it('ignores info lines without a score', () => {
    expect(parseUciInfoLine('info depth 12 currmove e2e4 currmovenumber 1')).toBeNull();
    expect(parseUciInfoLine('bestmove e2e4')).toBeNull();
  });

  it('parses bestmove and ignores ponder', () => {
    expect(parseBestmove('bestmove e2e4 ponder e7e5')).toBe('e2e4');
    expect(parseBestmove('info depth 1 score cp 0')).toBeNull();
  });

  it('converts side-to-move scores to white-positive', () => {
    expect(sideToMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')).toBe(
      'b',
    );
    expect(whitePositiveScore({ kind: 'cp', value: 40 }, 'b')).toEqual({
      kind: 'cp',
      value: -40,
    });
    expect(whitePositiveScore({ kind: 'mate', value: 3 }, 'b')).toEqual({
      kind: 'mate',
      value: -3,
    });
    expect(whitePositiveScore({ kind: 'cp', value: 12 }, 'w')).toEqual({
      kind: 'cp',
      value: 12,
    });
  });
});

describe('createFakeAdapter', () => {
  it('returns the scripted eval and can throw', async () => {
    const ok = createFakeAdapter((fen) => {
      const uci = fen.includes(' b ') ? 'e7e5' : 'e2e4';
      return { lines: [{ uci, score: { kind: 'cp', value: 0 }, pvUci: [uci] }] };
    });
    const start = await ok.evaluate('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(start.lines[0]?.uci).toBe('e2e4');
    await ok.close();

    const boom = createFakeAdapter(() => {
      throw new Error('engine exploded');
    });
    await expect(boom.evaluate('fen')).rejects.toThrow('engine exploded');
    await boom.close();
  });
});
