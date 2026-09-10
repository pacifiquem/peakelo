import { Chess, opposite } from 'chessops';
import { parseFen } from 'chessops/fen';
import { parseSquare } from 'chessops/util';
import type { AnalyzedPly, EvalScore } from '@peakelo/shared';

import { scoreToCp } from './eval';
import { piecesFromFen, uciSquares, type PieceRole } from './pgn';
import type { Color } from './square';

export const MOVE_ANNOTATIONS = [
  'brilliant',
  'best',
  'good',
  'inaccuracy',
  'miss',
  'mistake',
  'blunder',
] as const;

export type MoveAnnotation = (typeof MOVE_ANNOTATIONS)[number];

const MATERIAL: Record<PieceRole, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

const WINNING_CP = 200;
const LOSING_CP = -200;
const ALREADY_WON_CP = 300;
const NOT_BAD_AFTER_CP = -150;

export function moverCp(score: EvalScore, color: Color): number {
  const cp = scoreToCp(score);
  return color === 'white' ? cp : -cp;
}

export function winPercent(score: EvalScore): number {
  const cp = Math.min(1000, Math.max(-1000, scoreToCp(score)));
  const chances = 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
  return 50 + 50 * chances;
}

export function expectedPointsLost(ply: Pick<AnalyzedPly, 'bestEval' | 'evalAfter' | 'color'>): number {
  const best = moverExpectedPoints(ply.bestEval, ply.color);
  const played = moverExpectedPoints(ply.evalAfter, ply.color);
  return Math.max(0, best - played);
}

function moverExpectedPoints(score: EvalScore, color: Color): number {
  const white = winPercent(score) / 100;
  return color === 'white' ? white : 1 - white;
}

export function landedPieceHanging(fenAfter: string, dest: string, color: Color): boolean {
  const setup = parseFen(fenAfter);
  if (setup.isErr) return false;
  const built = Chess.fromSetup(setup.value);
  if (built.isErr) return false;
  const pos = built.value;
  const square = parseSquare(dest);
  if (square === undefined) return false;
  const piece = pos.board.get(square);
  if (!piece || piece.color !== color || piece.role === 'king') return false;
  const attackers = pos.kingAttackers(square, opposite(piece.color), pos.board.occupied);
  const defenders = pos.kingAttackers(square, piece.color, pos.board.occupied);
  return attackers.nonEmpty() && defenders.isEmpty();
}

export function isPieceSacrifice(
  ply: Pick<AnalyzedPly, 'fenBefore' | 'fenAfter' | 'uci' | 'color'>,
): boolean {
  const squares = uciSquares(ply.uci);
  if (!squares) return false;
  const pieces = piecesFromFen(ply.fenBefore);
  const mover = pieces.find((piece) => piece.square === squares.from);
  const captured = pieces.find((piece) => piece.square === squares.to);
  if (!mover) return false;
  const given = MATERIAL[mover.role];
  const taken = captured ? MATERIAL[captured.role] : 0;
  if (given < 3) return false;
  if (taken >= 3) return false;
  return landedPieceHanging(ply.fenAfter, squares.to, ply.color);
}

export function isBrilliant(ply: AnalyzedPly): boolean {
  const nearlyBest = ply.uci === ply.bestUci || ply.cpl <= 15;
  if (!nearlyBest) return false;
  if (moverCp(ply.evalAfter, ply.color) < NOT_BAD_AFTER_CP) return false;
  if (moverCp(ply.evalBefore, ply.color) >= ALREADY_WON_CP) return false;
  return isPieceSacrifice(ply);
}

export function isMiss(ply: AnalyzedPly): boolean {
  if (ply.uci === ply.bestUci) return false;
  if (moverCp(ply.bestEval, ply.color) < WINNING_CP) return false;
  if (moverCp(ply.evalAfter, ply.color) >= WINNING_CP) return false;
  return moverCp(ply.evalAfter, ply.color) > LOSING_CP;
}

export function annotatePly(ply: AnalyzedPly): MoveAnnotation {
  if (isBrilliant(ply)) return 'brilliant';
  if (isMiss(ply)) return 'miss';
  const lost = expectedPointsLost(ply);
  if (lost >= 0.2) return 'blunder';
  if (lost >= 0.1) return 'mistake';
  if (lost >= 0.05) return 'inaccuracy';
  if (lost <= 0.02 && (ply.uci === ply.bestUci || ply.cpl <= 10)) return 'best';
  return 'good';
}

export function evalAtPly(plies: AnalyzedPly[], ply: number): EvalScore | null {
  if (ply <= 0) return plies.find((item) => item.ply === 1)?.evalBefore ?? null;
  return plies.find((item) => item.ply === ply)?.evalAfter ?? null;
}

export function nextBestUci(plies: AnalyzedPly[], ply: number): string | null {
  return plies.find((item) => item.ply === ply + 1)?.bestUci ?? null;
}

export function formatEvalScore(score: EvalScore): string {
  if (score.kind === 'mate') {
    if (score.value === 0) return '0.0';
    return score.value > 0 ? `M${score.value}` : `-M${Math.abs(score.value)}`;
  }
  const pawns = score.value / 100;
  if (pawns === 0) return '0.0';
  const abs = Math.abs(pawns).toFixed(1);
  return pawns > 0 ? `+${abs}` : `-${abs}`;
}

export function whiteEvalShare(score: EvalScore): number {
  const cp = scoreToCp(score);
  const share = 1 / (1 + Math.exp(-cp / 280));
  return Math.min(0.97, Math.max(0.03, share));
}
