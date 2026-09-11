import type { GameUrlHit, TranscriptCue } from './types';

const LICHESS_RESERVED = new Set([
  'training',
  'practice',
  'analysis',
  'settings',
  'insights',
  'broadcast',
  'streamer',
  'tv',
]);

const LICHESS_RE =
  /(?:https?:\/\/)?(?:www\.)?lichess\.org\/(?:embed\/|game\/export\/)?([a-zA-Z0-9]{8})(?:\/(?:white|black))?(?:#\d+)?/gi;

const CHESSCOM_RE =
  /(?:https?:\/\/)?(?:www\.)?chess\.com\/(?:[^\s]*?\/)?(?:game\/(?:live|daily)\/|live\/game\/|daily\/game\/|analysis\/game\/(?:live|daily)\/)(\d{6,})/gi;

const CHESSCOM_BARE_RE =
  /(?:https?:\/\/)?(?:www\.)?chess\.com\/game\/(\d{6,})(?:\b|\/)/gi;

export function extractGameUrls(text: string): GameUrlHit[] {
  const hits: GameUrlHit[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(LICHESS_RE)) {
    const id = match[1];
    if (!id || LICHESS_RESERVED.has(id.toLowerCase())) continue;
    const key = `lichess:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      source: 'lichess',
      id,
      url: `https://lichess.org/${id}`,
    });
  }

  for (const match of text.matchAll(CHESSCOM_RE)) {
    const id = match[1];
    if (!id) continue;
    const raw = match[0].toLowerCase();
    const kind: 'live' | 'daily' = raw.includes('daily') ? 'daily' : 'live';
    const key = `chesscom:${kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      source: 'chesscom',
      id,
      kind,
      url: `https://www.chess.com/game/${kind}/${id}`,
    });
  }

  for (const match of text.matchAll(CHESSCOM_BARE_RE)) {
    const id = match[1];
    if (!id) continue;
    const key = `chesscom:live:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      source: 'chesscom',
      id,
      kind: 'live',
      url: `https://www.chess.com/game/live/${id}`,
    });
  }

  return hits;
}

export function extractGameUrlsFromVideo(input: {
  title?: string;
  description?: string;
  cues?: TranscriptCue[];
  earlySeconds?: number;
}): GameUrlHit[] {
  const chunks = [input.title ?? '', input.description ?? ''];
  const early = input.earlySeconds ?? 30;
  if (input.cues?.length) {
    chunks.push(
      input.cues
        .filter((cue) => cue.start <= early)
        .map((cue) => cue.text)
        .join(' '),
    );
  }
  return extractGameUrls(chunks.join('\n'));
}
