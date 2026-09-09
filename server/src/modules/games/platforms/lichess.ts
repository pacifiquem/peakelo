import { INITIAL_IMPORT_LIMIT, type TimeControl } from '@peakelo/shared';
import { fetchWithTimeout, UpstreamError } from '../../../lib/http';
import { lichessResult, mapLichessSpeed, selectNewest, type PlatformGame } from '../classify';

interface LichessGame {
  id?: string;
  variant?: string;
  speed?: string;
  lastMoveAt?: number;
  createdAt?: number;
  winner?: string;
  players?: {
    white?: { user?: { name?: string; id?: string } };
    black?: { user?: { name?: string; id?: string } };
  };
  pgn?: string;
}

export async function fetchLichessGames(input: {
  username: string;
  timeControls: TimeControl[];
  since?: Date;
  limit?: number;
  accessToken?: string | null;
}): Promise<PlatformGame[]> {
  const limit = input.limit ?? INITIAL_IMPORT_LIMIT;
  const perfType = input.timeControls.join(',');
  const url = new URL(`https://lichess.org/api/games/user/${encodeURIComponent(input.username)}`);
  url.searchParams.set('max', String(Math.min(limit, 200)));
  url.searchParams.set('perfType', perfType);
  url.searchParams.set('pgnInJson', 'true');
  url.searchParams.set('clocks', 'true');
  url.searchParams.set('opening', 'true');
  url.searchParams.set('moves', 'true');
  if (input.since) {
    url.searchParams.set('since', String(input.since.getTime()));
  }

  const headers: Record<string, string> = { Accept: 'application/x-ndjson' };
  if (input.accessToken) {
    headers.Authorization = `Bearer ${input.accessToken}`;
  }

  const response = await fetchWithTimeout(url.toString(), { headers }, 30_000);
  if (!response.ok) {
    throw new UpstreamError(`Lichess games ${response.status}`, response.status);
  }
  const text = await response.text();
  const collected: PlatformGame[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let game: LichessGame;
    try {
      game = JSON.parse(line) as LichessGame;
    } catch {
      continue;
    }
    if (game.variant && game.variant !== 'standard') continue;
    const timeControl = mapLichessSpeed(game.speed ?? '');
    if (!timeControl) continue;
    if (!game.id || !game.pgn) continue;
    const playedAt = new Date(game.lastMoveAt ?? game.createdAt ?? 0);
    if (Number.isNaN(playedAt.getTime()) || playedAt.getTime() === 0) continue;
    collected.push({
      externalId: game.id,
      timeControl,
      playedAt,
      whiteName: game.players?.white?.user?.name ?? 'White',
      blackName: game.players?.black?.user?.name ?? 'Black',
      result: lichessResult(game.winner),
      pgn: game.pgn,
    });
  }
  return selectNewest(collected, limit);
}
