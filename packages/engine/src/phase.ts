import { piecesFromFen } from './pgn';

export type Phase = 'opening' | 'middlegame' | 'endgame';

export function gamePhase(fen: string, ply: number): Phase {
  const pieces = piecesFromFen(fen);
  const queens = pieces.filter((piece) => piece.role === 'queen').length;
  const nonPawnExcludingKings = pieces.filter(
    (piece) => piece.role !== 'pawn' && piece.role !== 'king',
  ).length;
  if (queens === 0 || nonPawnExcludingKings <= 6) return 'endgame';
  if (ply <= 20) return 'opening';
  return 'middlegame';
}
