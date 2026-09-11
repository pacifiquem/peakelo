import { normalizeEpd, replayPgn, type ReplayedGame } from '../../packages/engine/src/pgn';

import { cleanQuote, cuesInWindow } from './quotes';
import { extractThemes } from './themes';
import type { SlowRunComment, Speaker, TranscriptCue } from './types';

const MIN_SPOKEN_PLIES = 6;
const WINDOW_FALLBACK_SEC = 60;
const FIRST_PLY_MAX_SEC = 300;
const MAX_GAP_SEC = 75;

const RANK_WORDS: Record<string, string> = {
  one: '1',
  won: '1',
  two: '2',
  too: '2',
  three: '3',
  four: '4',
  for: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
};

const PIECE_WORDS: Record<string, string> = {
  king: 'K',
  queen: 'Q',
  rook: 'R',
  bishop: 'B',
  knight: 'N',
  night: 'N',
  knights: 'N',
  nights: 'N',
};

type Token = { word: string; start: number };
type Candidate = { san: string; next: number };

export type AlignedPly = {
  san: string;
  fen: string;
  tSec: number;
};

export function stripSanMarks(san: string): string {
  return san.replace(/[+#?!]+/g, '');
}

export function toPgn(moves: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < moves.length; i += 1) {
    if (i % 2 === 0) parts.push(`${Math.floor(i / 2) + 1}.`);
    parts.push(moves[i]!);
  }
  return parts.join(' ');
}

export function tryPlaySan(played: string[], candidate: string): string | null {
  const base = stripSanMarks(candidate);
  if (!base) return null;
  const variants = [base, `${base}+`, `${base}#`];
  for (const variant of variants) {
    const replayed = replayPgn(toPgn([...played, variant]));
    if (replayed.plies.length === played.length + 1) {
      return stripSanMarks(replayed.plies.at(-1)!.san);
    }
  }
  return null;
}

function tokenizeCues(cues: TranscriptCue[]): Token[] {
  const tokens: Token[] = [];
  for (const cue of cues) {
    const words = cue.text
      .toLowerCase()
      .replace(/[^a-z0-9+#\-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    for (const word of words) tokens.push({ word, start: cue.start });
  }
  return tokens;
}

function rankFrom(word: string | undefined): string | null {
  if (!word) return null;
  if (/^[1-8]$/.test(word)) return word;
  return RANK_WORDS[word] ?? null;
}

function parseSquare(words: string[], index: number): { sq: string; next: number } | null {
  const word = words[index] ?? '';
  if (/^[a-h][1-8]$/.test(word)) return { sq: word, next: index + 1 };
  if (/^[a-h]$/.test(word)) {
    const rank = rankFrom(words[index + 1]);
    if (rank) return { sq: `${word}${rank}`, next: index + 2 };
  }
  return null;
}

function parseCastle(words: string[], index: number): Candidate | null {
  const first = words[index] ?? '';
  if (first === 'castles' || first === 'castle' || first === 'castling') {
    const next = `${words[index + 1] ?? ''} ${words[index + 2] ?? ''}`;
    if (/queen/.test(next) || next.includes('long')) {
      return { san: 'O-O-O', next: index + (words[index + 2] ? 3 : 2) };
    }
    if (/king/.test(next) || next.includes('short') || next.includes('side')) {
      return { san: 'O-O', next: index + (words[index + 2] ? 3 : 2) };
    }
    return { san: 'O-O', next: index + 1 };
  }
  if ((first === 'o' || first === '0') && (words[index + 1] === 'o' || words[index + 1] === '0')) {
    if (words[index + 2] === 'o' || words[index + 2] === '0') {
      return { san: 'O-O-O', next: index + 3 };
    }
    return { san: 'O-O', next: index + 2 };
  }
  if (first === 'o-o-o' || first === '0-0-0') return { san: 'O-O-O', next: index + 1 };
  if (first === 'o-o' || first === '0-0') return { san: 'O-O', next: index + 1 };
  return null;
}

function skipTakesOrTo(words: string[], index: number): { takes: boolean; next: number } {
  let next = index;
  let takes = false;
  if (words[next] === 'takes' || words[next] === 'take' || words[next] === 'captures' || words[next] === 'x') {
    takes = true;
    next += 1;
    if (words[next] === 'on') next += 1;
  } else if (words[next] === 'to') {
    next += 1;
  }
  return { takes, next };
}

export function candidatesAt(words: string[], index: number): Candidate[] {
  const out: Candidate[] = [];
  const castle = parseCastle(words, index);
  if (castle) out.push(castle);

  const raw = words[index] ?? '';
  if (/^[NBRQK][a-h1-8]?x?[a-h][1-8][+#]?$/.test(raw) || /^[a-h]x[a-h][1-8][+#]?$/.test(raw) || /^[a-h][1-8][+#]?$/.test(raw)) {
    out.push({ san: raw.replace('0-0-0', 'O-O-O').replace('0-0', 'O-O'), next: index + 1 });
  }

  const piece = PIECE_WORDS[raw];
  if (piece) {
    const skipped = skipTakesOrTo(words, index + 1);
    const square = parseSquare(words, skipped.next);
    if (square) {
      out.push({ san: `${piece}${skipped.takes ? 'x' : ''}${square.sq}`, next: square.next });
    }
  }

  if (raw === 'pawn') {
    const skipped = skipTakesOrTo(words, index + 1);
    const square = parseSquare(words, skipped.next);
    if (square) {
      out.push({
        san: skipped.takes ? `x${square.sq}` : square.sq,
        next: square.next,
      });
    }
  }

  if (/^[a-h]$/.test(raw)) {
    const skipped = skipTakesOrTo(words, index + 1);
    if (skipped.takes) {
      const square = parseSquare(words, skipped.next);
      if (square) out.push({ san: `${raw}x${square.sq}`, next: square.next });
    }
    const rank = rankFrom(words[index + 1]);
    if (rank) out.push({ san: `${raw}${rank}`, next: index + 2 });
  }

  return out;
}

export function spokenWalk(cues: TranscriptCue[]): AlignedPly[] {
  const tokens = tokenizeCues(cues);
  const words = tokens.map((token) => token.word);
  const played: string[] = [];
  const plies: AlignedPly[] = [];
  let index = 0;
  let lastMatchAt = 0;
  while (index < tokens.length) {
    const tSec = tokens[index]!.start;
    if (plies.length === 0 && tSec > FIRST_PLY_MAX_SEC) break;
    if (plies.length > 0 && tSec - lastMatchAt > MAX_GAP_SEC) break;
    const options = candidatesAt(words, index);
    let matched = false;
    for (const option of options) {
      const official = tryPlaySan(played, option.san);
      if (!official) continue;
      const replayed = replayPgn(toPgn([...played, official]));
      const last = replayed.plies.at(-1);
      if (!last) continue;
      played.push(official);
      plies.push({ san: last.san, fen: last.fen, tSec });
      lastMatchAt = tSec;
      index = option.next;
      matched = true;
      break;
    }
    if (!matched) index += 1;
  }
  return plies;
}

function compact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function spokenForms(san: string): string[] {
  const clean = stripSanMarks(san);
  const forms = new Set<string>([compact(clean)]);
  if (clean === 'O-O') {
    for (const form of ['oo', '00', 'castles', 'castlekingside', 'castlesshort', 'castlesshortside']) {
      forms.add(form);
    }
  } else if (clean === 'O-O-O') {
    for (const form of ['ooo', '000', 'castlequeenside', 'castleslong', 'castleslongside']) {
      forms.add(form);
    }
  } else {
    const pieceLetter = /^[NBRQK]/.test(clean) ? clean[0] : '';
    const rest = pieceLetter ? clean.slice(1) : clean;
    const capture = rest.includes('x');
    const square = rest.replace(/x/g, '').replace(/^[a-h1-8]/, (ch) => (/[a-h1-8]/.test(ch) && rest.includes('x') ? '' : ch));
    const dest = rest.match(/[a-h][1-8]$/)?.[0] ?? '';
    const names: Record<string, string[]> = {
      N: ['knight', 'night'],
      B: ['bishop'],
      R: ['rook'],
      Q: ['queen'],
      K: ['king'],
    };
    if (pieceLetter && dest) {
      for (const name of names[pieceLetter] ?? []) {
        forms.add(compact(`${name}${dest}`));
        forms.add(compact(`${name}to${dest}`));
        if (capture) forms.add(compact(`${name}takes${dest}`));
      }
    } else if (dest) {
      forms.add(dest);
      forms.add(compact(`pawn${dest}`));
      forms.add(compact(`pawnto${dest}`));
    }
    void square;
  }
  return [...forms];
}

function findSanFrom(tokens: Token[], from: number, san: string): number | null {
  const targets = new Set(spokenForms(san));
  for (let i = from; i < tokens.length; i += 1) {
    const windows = [1, 2, 3, 4];
    for (const size of windows) {
      const slice = tokens.slice(i, i + size).map((token) => token.word);
      if (targets.has(compact(slice.join('')))) return i;
    }
    const options = candidatesAt(
      tokens.map((token) => token.word),
      i,
    );
    if (options.some((option) => compact(stripSanMarks(option.san)) === compact(stripSanMarks(san)))) {
      return i;
    }
  }
  return null;
}

function commentsFromHits(
  cues: TranscriptCue[],
  hits: AlignedPly[],
  meta: { speaker: Speaker; videoId: string; title: string; confidence: 'high' | 'low' },
): SlowRunComment[] {
  const comments: SlowRunComment[] = [];
  for (let i = 0; i < hits.length; i += 1) {
    const hit = hits[i]!;
    const end = hits[i + 1]?.tSec ?? hit.tSec + WINDOW_FALLBACK_SEC;
    const quote = cleanQuote(cuesInWindow(cues, hit.tSec, end));
    if (quote.length < 20) continue;
    comments.push({
      speaker: meta.speaker,
      videoId: meta.videoId,
      title: meta.title,
      tSec: Math.round(hit.tSec),
      quote,
      epd: normalizeEpd(hit.fen),
      themes: extractThemes(quote),
      confidence: meta.confidence,
    });
  }
  return comments;
}

export function alignTranscript(input: {
  cues: TranscriptCue[];
  speaker: Speaker;
  videoId: string;
  title: string;
  replayed?: ReplayedGame | null;
  hasGameUrl: boolean;
}): SlowRunComment[] {
  if (input.replayed && input.replayed.plies.length > 0) {
    const tokens = tokenizeCues(input.cues);
    let searchFrom = 0;
    const hits: AlignedPly[] = [];
    for (const ply of input.replayed.plies) {
      const found = findSanFrom(tokens, searchFrom, ply.san);
      if (found == null) continue;
      hits.push({ san: ply.san, fen: ply.fen, tSec: tokens[found]!.start });
      searchFrom = found + 1;
    }
    if (hits.length === 0) return [];
    return commentsFromHits(input.cues, hits, {
      speaker: input.speaker,
      videoId: input.videoId,
      title: input.title,
      confidence: input.hasGameUrl ? 'high' : 'low',
    });
  }

  // Spoken SAN without a recovered PGN is too easy to pin on the wrong board
  // (e.g. "bishop f4" becoming 1.f4). Keep those quotes off the EPD index.
  return [];
}
