import fs from 'node:fs';

import { normalizeEpd, piecesFromFen } from '../../packages/engine/src/pgn';

import { POSITIONS_PATH } from './paths';
import type { SlowRunIndex, SlowRunSearchHit } from './types';

export type SearchSlowRunsInput = {
  fen: string;
  query?: string;
  limit?: number;
};

function sideToMove(epd: string): string {
  return epd.split(/\s+/)[1] ?? 'w';
}

function pawnStructure(epd: string): string {
  const pieces = piecesFromFen(epd);
  const white = pieces
    .filter((piece) => piece.role === 'pawn' && piece.color === 'white')
    .map((piece) => piece.square)
    .sort()
    .join('');
  const black = pieces
    .filter((piece) => piece.role === 'pawn' && piece.color === 'black')
    .map((piece) => piece.square)
    .sort()
    .join('');
  return `${white}|${black}`;
}

function materialKey(epd: string): string {
  const pieces = piecesFromFen(epd);
  const roles = ['queen', 'rook', 'bishop', 'knight', 'pawn'] as const;
  return roles
    .map((role) => {
      const white = pieces.filter((piece) => piece.color === 'white' && piece.role === role).length;
      const black = pieces.filter((piece) => piece.color === 'black' && piece.role === role).length;
      return `${white}${role[0]}${black}`;
    })
    .join('');
}

function queryTerms(query: string | undefined): string[] {
  if (!query) return [];
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
}

function textHits(comment: SlowRunSearchHit, terms: string[]): number {
  if (terms.length === 0) return 0;
  const hay = `${comment.quote} ${comment.title}`.toLowerCase();
  return terms.filter((term) => hay.includes(term)).length;
}

export function loadSlowRunIndex(filePath = POSITIONS_PATH): SlowRunIndex | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as SlowRunIndex;
    if (!parsed || !Array.isArray(parsed.comments)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function searchSlowRuns(
  input: SearchSlowRunsInput,
  index: SlowRunIndex | null | undefined,
): SlowRunSearchHit[] {
  if (!index || index.comments.length === 0) return [];
  const limit = input.limit ?? 8;
  const target = input.fen.trim() ? normalizeEpd(input.fen) : '';
  const terms = queryTerms(input.query);
  const targetSide = target ? sideToMove(target) : '';
  const targetPawns = target ? pawnStructure(target) : '';
  const targetMaterial = target ? materialKey(target) : '';

  const scored: Array<{ hit: SlowRunSearchHit; score: number }> = [];
  for (const comment of index.comments) {
    const matches = textHits(comment, terms);
    if (terms.length > 0 && matches === 0 && comment.epd !== target) continue;

    let score = matches * 5;
    if (target && comment.epd === target) {
      score += 100;
    } else if (target && comment.epd) {
      if (sideToMove(comment.epd) !== targetSide) {
        if (matches === 0) continue;
      } else if (pawnStructure(comment.epd) === targetPawns) {
        score += 70;
      } else if (materialKey(comment.epd) === targetMaterial) {
        score += 45;
      } else if (matches === 0) {
        continue;
      }
    } else if (!target && matches === 0) {
      continue;
    }

    if (score <= 0) continue;
    scored.push({ hit: comment, score });
  }

  scored.sort((a, b) => b.score - a.score || a.hit.tSec - b.hit.tSec);
  const seen = new Set<string>();
  const out: SlowRunSearchHit[] = [];
  for (const row of scored) {
    const key = `${row.hit.videoId}:${row.hit.tSec}:${row.hit.quote}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row.hit);
    if (out.length >= limit) break;
  }
  return out;
}
