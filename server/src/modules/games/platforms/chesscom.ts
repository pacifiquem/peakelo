import { INITIAL_IMPORT_LIMIT, type TimeControl } from '@peakelo/shared';
import { env } from '../../../config/env';
import { fetchJson, fetchWithTimeout, UpstreamError } from '../../../lib/http';
import { parseEloValue } from '@peakelo/shared';
import { ratingsFromPgn } from '@peakelo/engine';
import { chesscomResult, mapChesscomTimeClass, selectNewest, type PlatformGame } from '../classify';

const BASE = 'https://api.chess.com/pub';

export function chesscomArchiveMonths(input: {
  dateHeader?: string;
  endTime?: number;
}): Array<{ year: string; month: string }> {
  const stamps: Date[] = [];
  if (input.endTime) {
    const ended = new Date(input.endTime * 1000);
    if (!Number.isNaN(ended.getTime())) stamps.push(ended);
  }
  const header = input.dateHeader?.match(/^(\d{4})\.(\d{2})(?:\.(\d{2}))?/);
  if (header) {
    stamps.push(new Date(Date.UTC(Number(header[1]), Number(header[2]) - 1, Number(header[3] ?? '1'))));
  }
  const seen = new Set<string>();
  const months: Array<{ year: string; month: string }> = [];
  for (const stamp of stamps) {
    for (const delta of [0, -1, 1]) {
      const next = new Date(Date.UTC(stamp.getUTCFullYear(), stamp.getUTCMonth() + delta, 1));
      const year = String(next.getUTCFullYear());
      const month = String(next.getUTCMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      if (seen.has(key)) continue;
      seen.add(key);
      months.push({ year, month });
    }
  }
  return months;
}

function headers(): Record<string, string> {
  return {
    Accept: 'application/json',
    'User-Agent': env.CHESSCOM_USER_AGENT,
  };
}

interface ChesscomProfile {
  player_id?: number;
  username?: string;
  avatar?: string;
  name?: string;
}

interface ChesscomGame {
  url?: string;
  uuid?: string;
  pgn?: string;
  end_time?: number;
  time_class?: string;
  rules?: string;
  white?: { username?: string; result?: string; rating?: number };
  black?: { username?: string; result?: string; rating?: number };
}

export async function fetchChesscomProfile(username: string): Promise<{
  id: string;
  username: string;
  avatarUrl: string | null;
  displayName: string;
}> {
  try {
    const data = await fetchJson<ChesscomProfile>(
      `${BASE}/player/${encodeURIComponent(username.toLowerCase())}`,
      { headers: headers() },
    );
    if (!data.player_id || !data.username) {
      throw new UpstreamError('Chess.com profile was missing an id', 502);
    }
    return {
      id: String(data.player_id),
      username: data.username,
      avatarUrl: data.avatar ?? null,
      displayName: data.name || data.username,
    };
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 404) {
      throw error;
    }
    throw error;
  }
}

export async function fetchChesscomGameById(input: {
  kind: 'live' | 'daily';
  id: string;
}): Promise<PlatformGame | null> {
  const callback = await fetchJson<{
    game?: {
      pgnHeaders?: { White?: string; Date?: string };
      endTime?: number;
    };
  }>(`https://www.chess.com/callback/${input.kind}/game/${input.id}`, { headers: headers() });
  const white = callback.game?.pgnHeaders?.White;
  const date = callback.game?.pgnHeaders?.Date;
  if (!white) return null;
  const months = chesscomArchiveMonths({
    endTime: callback.game?.endTime,
    dateHeader: date,
  });
  if (months.length === 0) return null;
  let match: ChesscomGame | undefined;
  for (const stamp of months) {
    const archive = await fetchJson<{ games?: ChesscomGame[] }>(
      `${BASE}/player/${encodeURIComponent(white.toLowerCase())}/games/${stamp.year}/${stamp.month}`,
      { headers: headers() },
    );
    match = (archive.games ?? []).find((game) => {
      const urlId = game.url?.match(/\/(\d+)\s*$/)?.[1];
      return urlId === input.id;
    });
    if (match?.pgn) break;
  }
  if (!match?.pgn) return null;
  if (match.rules && match.rules !== 'chess') return null;
  const timeControl = mapChesscomTimeClass(match.time_class ?? '');
  if (!timeControl) return null;
  const playedAt = new Date((match.end_time ?? 0) * 1000);
  const fromPgn = ratingsFromPgn(match.pgn);
  return {
    externalId: input.id,
    timeControl,
    playedAt: Number.isNaN(playedAt.getTime()) ? new Date() : playedAt,
    whiteName: match.white?.username ?? white,
    blackName: match.black?.username ?? 'Black',
    result: chesscomResult(match.white?.result ?? '', match.black?.result ?? ''),
    pgn: match.pgn,
    whiteRating: parseEloValue(match.white?.rating) ?? fromPgn.white,
    blackRating: parseEloValue(match.black?.rating) ?? fromPgn.black,
  };
}

export async function fetchChesscomGames(input: {
  username: string;
  timeControls: TimeControl[];
  since?: Date;
  limit?: number;
}): Promise<PlatformGame[]> {
  const limit = input.limit ?? INITIAL_IMPORT_LIMIT;
  const wanted = new Set(input.timeControls);
  const archives = await fetchJson<{ archives?: string[] }>(
    `${BASE}/player/${encodeURIComponent(input.username.toLowerCase())}/games/archives`,
    { headers: headers() },
  );
  const urls = [...(archives.archives ?? [])].reverse();
  const collected: PlatformGame[] = [];

  for (const archiveUrl of urls) {
    const month = await fetchJson<{ games?: ChesscomGame[] }>(archiveUrl, { headers: headers() });
    for (const game of month.games ?? []) {
      if (game.rules && game.rules !== 'chess') continue;
      const timeControl = mapChesscomTimeClass(game.time_class ?? '');
      if (!timeControl || !wanted.has(timeControl)) continue;
      if (!game.pgn) continue;
      const playedAt = new Date((game.end_time ?? 0) * 1000);
      if (Number.isNaN(playedAt.getTime()) || playedAt.getTime() === 0) continue;
      if (input.since && playedAt <= input.since) continue;
      const externalId = chesscomExternalId(game);
      if (!externalId) continue;
      const fromPgn = ratingsFromPgn(game.pgn);
      collected.push({
        externalId,
        timeControl,
        playedAt,
        whiteName: game.white?.username ?? 'White',
        blackName: game.black?.username ?? 'Black',
        result: chesscomResult(game.white?.result ?? '', game.black?.result ?? ''),
        pgn: game.pgn,
        whiteRating: parseEloValue(game.white?.rating) ?? fromPgn.white,
        blackRating: parseEloValue(game.black?.rating) ?? fromPgn.black,
      });
    }
    const monthStart = archiveMonth(archiveUrl);
    if (input.since && monthStart && monthStart < startOfMonth(input.since)) {
      break;
    }
    if (selectNewest(collected, limit).length >= limit && !input.since) {
      const newest = selectNewest(collected, limit);
      const oldestKept = newest[newest.length - 1]?.playedAt;
      if (oldestKept && monthStart && monthStart < oldestKept) {
        break;
      }
    }
  }

  return selectNewest(collected, input.since ? Number.MAX_SAFE_INTEGER : limit);
}

function chesscomExternalId(game: ChesscomGame): string | null {
  if (game.uuid) return game.uuid;
  if (!game.url) return null;
  const match = game.url.match(/\/(\d+)\s*$/);
  return match?.[1] ?? game.url;
}

function archiveMonth(url: string): Date | null {
  const match = url.match(/\/games\/(\d{4})\/(\d{2})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function chesscomReachable(username: string): Promise<boolean> {
  const response = await fetchWithTimeout(
    `${BASE}/player/${encodeURIComponent(username.toLowerCase())}`,
    { headers: headers() },
  );
  return response.ok;
}
