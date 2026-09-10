import { makeUci } from 'chessops';
import { makeFen } from 'chessops/fen';
import { parsePgn, startingPosition } from 'chessops/pgn';
import { parseSan } from 'chessops/san';

import { parseClkComment, parseTimeControlHeader } from './clocks';
import { FILES, RANKS, type Color, type Square } from './square';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type PieceRole = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export type BoardPiece = {
  square: Square;
  role: PieceRole;
  color: Color;
};

export type ReplayPly = {
  ply: number;
  san: string;
  fen: string;
  fenBefore: string;
  uci: string;
  clockAfterMs: number | null;
};

export type ReplayedGame = {
  startFen: string;
  plies: ReplayPly[];
  incrementMs: number;
  baseTimeMs: number | null;
};

const ROLE_FROM_LETTER: Record<string, PieceRole> = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
};

export function replayPgn(pgn: string): ReplayedGame {
  const games = parsePgn(pgn.trim());
  const game = games[0];
  if (!game) return { startFen: START_FEN, plies: [], incrementMs: 0, baseTimeMs: null };

  const started = startingPosition(game.headers);
  if (started.isErr) return { startFen: START_FEN, plies: [], incrementMs: 0, baseTimeMs: null };
  const clock = parseTimeControlHeader(game.headers.get('TimeControl'));

  const pos = started.value;
  const startFen = makeFen(pos.toSetup());
  const plies: ReplayPly[] = [];
  let ply = 0;
  for (const node of game.moves.mainline()) {
    const move = parseSan(pos, node.san);
    if (!move) break;
    const fenBefore = makeFen(pos.toSetup());
    const uci = makeUci(move);
    pos.play(move);
    ply += 1;
    const clockAfterMs = parseClkComment((node.comments ?? []).join(' '));
    plies.push({ ply, san: node.san, fen: makeFen(pos.toSetup()), fenBefore, uci, clockAfterMs });
  }
  return {
    startFen,
    plies,
    incrementMs: clock?.incrementMs ?? 0,
    baseTimeMs: clock?.baseMs ?? null,
  };
}

export function piecesFromFen(fen: string): BoardPiece[] {
  const board = fen.split(' ')[0] ?? '';
  const pieces: BoardPiece[] = [];
  let rank = 7;
  let file = 0;
  for (const char of board) {
    if (char === '/') {
      rank -= 1;
      file = 0;
      continue;
    }
    if (char >= '1' && char <= '8') {
      file += Number(char);
      continue;
    }
    const role = ROLE_FROM_LETTER[char.toLowerCase()];
    const square = squareAt(file, rank);
    if (role && square) {
      pieces.push({
        square,
        role,
        color: char === char.toUpperCase() ? 'white' : 'black',
      });
    }
    file += 1;
  }
  return pieces;
}

export function uciSquares(uci: string): { from: Square; to: Square } | null {
  if (uci.length < 4) return null;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  if (!isBoardSquare(from) || !isBoardSquare(to)) return null;
  return { from, to };
}

function squareAt(file: number, rank: number): Square | null {
  const fileLetter = FILES[file];
  const rankLetter = RANKS[rank];
  if (!fileLetter || !rankLetter) return null;
  return `${fileLetter}${rankLetter}`;
}

function isBoardSquare(value: string): value is Square {
  return value.length === 2 && FILES.includes(value[0] as (typeof FILES)[number]);
}
