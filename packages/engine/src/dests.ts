import { Chess } from 'chessops';
import { chessgroundDests } from 'chessops/compat';
import { parseFen } from 'chessops/fen';

import { piecesFromFen } from './pgn';
import type { Color, Square } from './square';
import { isSquare } from './square';

export function sideToMove(fen: string): Color | null {
  const turn = fen.split(' ')[1];
  if (turn === 'w') return 'white';
  if (turn === 'b') return 'black';
  return null;
}

export function legalDests(fen: string): Partial<Record<Square, Square[]>> {
  const setup = parseFen(fen);
  if (setup.isErr) return {};
  const pos = Chess.fromSetup(setup.value);
  if (pos.isErr) return {};
  const dests: Partial<Record<Square, Square[]>> = {};
  for (const [from, tos] of chessgroundDests(pos.value)) {
    if (!isSquare(from)) continue;
    dests[from] = tos.filter(isSquare);
  }
  return dests;
}

export function isPawnPromotion(fen: string, from: string, to: string): boolean {
  if (!isSquare(from) || !isSquare(to)) return false;
  const piece = piecesFromFen(fen).find((item) => item.square === from);
  if (piece?.role !== 'pawn') return false;
  return (piece.color === 'white' && to[1] === '8') || (piece.color === 'black' && to[1] === '1');
}

export function uciFromSquares(fen: string, from: string, to: string, promotion = 'q'): string | null {
  if (!isSquare(from) || !isSquare(to)) return null;
  if (isPawnPromotion(fen, from, to)) {
    const promo = promotion.toLowerCase();
    if (!['q', 'r', 'b', 'n'].includes(promo)) return null;
    return `${from}${to}${promo}`;
  }
  return `${from}${to}`;
}
