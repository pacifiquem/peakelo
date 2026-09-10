import { Chess, opposite } from 'chessops';
import { parseFen } from 'chessops/fen';
import { isDrop, type Color, type Move, type Square } from 'chessops/types';
import { parseUci } from 'chessops/util';

import { cplFromScores, type EvalScore, type Judgment } from './eval';

export type Overlooked =
  | 'hanging_piece'
  | 'missed_hanging'
  | 'missed_capture'
  | 'missed_check'
  | 'missed_mate'
  | 'missed_combination'
  | 'material_loss'
  | 'time_scramble';

export type OverlookInput = {
  fenBefore: string;
  playedUci: string;
  bestUci: string;
  pvUci: string[];
  judgment: Judgment;
  timeSpentMs: number | null;
  clockAfterMs: number | null;
  bestScore: EvalScore;
  playedScore: EvalScore;
};

const MATERIAL: Record<string, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

export function detectOverlooked(input: OverlookInput): Overlooked[] {
  const before = positionFromFen(input.fenBefore);
  if (!before) return [];
  const mover = before.turn;
  const tags: Overlooked[] = [];

  const playedMove = parseLegal(before, input.playedUci);
  const bestMove = parseLegal(before, input.bestUci);
  const afterPlayed = playedMove ? playFrom(before, playedMove) : null;
  const afterBest = bestMove ? playFrom(before, bestMove) : null;
  const cpl = cplFromScores(input.bestScore, input.playedScore, mover);
  const costly = cpl >= 50;

  if (afterPlayed && playedMove && costly) {
    const hangingBefore = new Set(hangingSquares(before, mover));
    const hangingAfter = hangingSquares(afterPlayed, mover);
    if (hangingAfter.some((square) => !hangingBefore.has(square))) {
      tags.push('hanging_piece');
    }
  }

  if (bestMove && playedMove && costly) {
    const hangingBefore = hangingSquares(before, opposite(mover));
    const bestTakesHanging = capturesHanging(before, bestMove, hangingBefore);
    const playedTakesHanging = capturesHanging(before, playedMove, hangingBefore);
    if (bestTakesHanging && !playedTakesHanging) tags.push('missed_hanging');
  }

  if (bestMove && playedMove && cpl >= 50) {
    const bestCaptures = capturedSquare(before, bestMove) !== undefined;
    const playedCaptures = capturedSquare(before, playedMove) !== undefined;
    if (bestCaptures && !playedCaptures) tags.push('missed_capture');
    if (afterBest?.isCheck() && !afterPlayed?.isCheck()) tags.push('missed_check');
  }

  if (isMateFor(input.bestScore, mover) && !isMateFor(input.playedScore, mover)) {
    tags.push('missed_mate');
  }

  const comboDepth = combinationDepth(before, input.pvUci);
  if ((input.judgment === 'mistake' || input.judgment === 'blunder') && comboDepth >= 3) {
    tags.push('missed_combination');
  }

  if (
    costly &&
    afterPlayed &&
    afterBest &&
    materialOf(afterPlayed, mover) < materialOf(afterBest, mover)
  ) {
    tags.push('material_loss');
  }

  const scrambleClock =
    (input.timeSpentMs !== null && input.timeSpentMs < 1500) ||
    (input.clockAfterMs !== null && input.clockAfterMs < 20_000);
  if (scrambleClock && (input.judgment === 'mistake' || input.judgment === 'blunder')) {
    tags.push('time_scramble');
  }

  return tags;
}

function positionFromFen(fen: string): Chess | null {
  const setup = parseFen(fen);
  if (setup.isErr) return null;
  const pos = Chess.fromSetup(setup.value);
  if (pos.isErr) return null;
  return pos.value;
}

function parseLegal(pos: Chess, uci: string): Move | null {
  const move = parseUci(uci);
  if (!move || !pos.isLegal(move)) return null;
  return move;
}

function playFrom(pos: Chess, move: Move): Chess {
  const next = pos.clone();
  next.play(move);
  return next;
}

function capturedSquare(pos: Chess, move: Move): Square | undefined {
  if (isDrop(move)) return undefined;
  if (pos.board.has(move.to)) return move.to;
  const piece = pos.board.get(move.from);
  if (piece?.role === 'pawn' && pos.epSquare === move.to) {
    return move.to + (piece.color === 'white' ? -8 : 8);
  }
  return undefined;
}

function capturesHanging(pos: Chess, move: Move, hanging: Square[]): boolean {
  const captured = capturedSquare(pos, move);
  return captured !== undefined && hanging.includes(captured);
}

function hangingSquares(pos: Chess, color: Color): Square[] {
  const squares: Square[] = [];
  for (const [square, piece] of pos.board) {
    if (piece.color === color && isHanging(pos, square, color)) squares.push(square);
  }
  return squares;
}

export function combinationDepth(start: Chess, pvUci: string[]): number {
  let pos = start;
  let depth = 0;
  for (const uci of pvUci) {
    const move = parseLegal(pos, uci);
    if (!move) break;
    const capture = capturedSquare(pos, move) !== undefined;
    pos = playFrom(pos, move);
    if (!capture && !pos.isCheck()) break;
    depth += 1;
  }
  return depth;
}

function isHanging(pos: Chess, square: Square, color: Color): boolean {
  const piece = pos.board.get(square);
  if (!piece || piece.color !== color || piece.role === 'king') return false;
  const attackers = pos.kingAttackers(square, opposite(color), pos.board.occupied);
  const defenders = pos.kingAttackers(square, color, pos.board.occupied);
  return attackers.nonEmpty() && defenders.isEmpty();
}

function isMateFor(score: EvalScore, mover: Color): boolean {
  if (score.kind !== 'mate') return false;
  return mover === 'white' ? score.value > 0 : score.value < 0;
}

function materialOf(pos: Chess, color: Color): number {
  let total = 0;
  for (const [, piece] of pos.board) {
    const value = MATERIAL[piece.role] ?? 0;
    total += piece.color === color ? value : -value;
  }
  return total;
}


