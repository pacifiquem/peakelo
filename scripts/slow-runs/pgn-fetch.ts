import type { GameUrlHit } from './types';

function userAgent(): string {
  return process.env.CHESSCOM_USER_AGENT ?? 'Peakelo/0.0.0 (slow-run corpus)';
}

async function readText(url: string, headers: Record<string, string>, timeoutMs = 20_000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function looksLikePgn(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.includes('[') && /1\.\s+\S+/.test(trimmed);
}

export async function fetchLichessPgn(gameId: string): Promise<string | null> {
  const text = await readText(`https://lichess.org/game/export/${gameId}?clocks=true`, {
    Accept: 'application/x-chess-pgn',
    'User-Agent': userAgent(),
  });
  if (!text || !looksLikePgn(text)) return null;
  return text;
}

type ChesscomCallback = {
  game?: {
    pgn?: string;
    pgnHeaders?: { White?: string; Date?: string };
  };
};

type ChesscomArchive = {
  games?: Array<{ url?: string; pgn?: string }>;
};

async function fetchChesscomArchivePgn(username: string, date: string, gameId: string): Promise<string | null> {
  const [year, month] = date.split('.');
  if (!year || !month) return null;
  const text = await readText(
    `https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/games/${year}/${month}`,
    { Accept: 'application/json', 'User-Agent': userAgent() },
  );
  if (!text) return null;
  let parsed: ChesscomArchive;
  try {
    parsed = JSON.parse(text) as ChesscomArchive;
  } catch {
    return null;
  }
  const game = (parsed.games ?? []).find((row) => row.url?.endsWith(`/${gameId}`));
  return typeof game?.pgn === 'string' && looksLikePgn(game.pgn) ? game.pgn : null;
}

export async function fetchChesscomPgn(gameId: string, kind: 'live' | 'daily' = 'live'): Promise<string | null> {
  const kinds: Array<'live' | 'daily'> = kind === 'daily' ? ['daily', 'live'] : ['live', 'daily'];
  for (const current of kinds) {
    const text = await readText(`https://www.chess.com/callback/${current}/game/${gameId}`, {
      Accept: 'application/json',
      'User-Agent': userAgent(),
    });
    if (!text) continue;
    let parsed: ChesscomCallback;
    try {
      parsed = JSON.parse(text) as ChesscomCallback;
    } catch {
      continue;
    }
    if (typeof parsed.game?.pgn === 'string' && looksLikePgn(parsed.game.pgn)) {
      return parsed.game.pgn;
    }
    const headers = parsed.game?.pgnHeaders;
    if (headers?.White && headers.Date) {
      const archived = await fetchChesscomArchivePgn(headers.White, headers.Date, gameId);
      if (archived) return archived;
    }
  }
  return null;
}

export async function fetchPgnForUrl(hit: GameUrlHit): Promise<string | null> {
  if (hit.source === 'lichess') return fetchLichessPgn(hit.id);
  return fetchChesscomPgn(hit.id, hit.kind ?? 'live');
}
