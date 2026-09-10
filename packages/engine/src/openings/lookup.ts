import { Chess } from 'chessops';
import { makeFen } from 'chessops/fen';
import { parseSan } from 'chessops/san';

import rawBook from './book.json';
import { replayPgn } from '../pgn';

type BookEntry = { eco: string; name: string; pgn: string };
type OpeningHit = { eco: string; name: string; pgn: string };

const book = rawBook as BookEntry[];

let table: Map<string, OpeningHit> | null = null;

function epd(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

function ensureBook(): Map<string, OpeningHit> {
  if (table) return table;
  const next = new Map<string, OpeningHit>();
  for (const entry of book) {
    const replayed = replayPgn(entry.pgn);
    const fen = replayed.plies.at(-1)?.fen;
    if (!fen) continue;
    next.set(epd(fen), { eco: entry.eco, name: entry.name, pgn: entry.pgn });
  }
  table = next;
  return next;
}

export function lookupOpening(fen: string): { eco: string; name: string } | null {
  const hit = ensureBook().get(epd(fen));
  if (!hit) return null;
  return { eco: hit.eco, name: hit.name };
}

export function openingFromSans(sans: string[]): { eco: string; name: string; pgn: string } | null {
  const pos = Chess.default();
  for (const san of sans) {
    const move = parseSan(pos, san);
    if (!move) return null;
    pos.play(move);
  }
  return ensureBook().get(epd(makeFen(pos.toSetup()))) ?? null;
}
