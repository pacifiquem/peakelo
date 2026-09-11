import type { GameResult, TimeControl } from '@peakelo/shared';

const DRAW_RESULTS = new Set([
  'agreed',
  'repetition',
  'stalemate',
  'insufficient',
  '50move',
  'timevsinsufficient',
  'draw',
]);

export function mapChesscomTimeClass(timeClass: string): TimeControl | null {
  if (timeClass === 'bullet' || timeClass === 'blitz' || timeClass === 'rapid') return timeClass;
  return null;
}

export function mapLichessSpeed(speed: string): TimeControl | null {
  if (speed === 'bullet' || speed === 'blitz' || speed === 'rapid') return speed;
  return null;
}

export function chesscomResult(whiteResult: string, blackResult: string): GameResult {
  if (whiteResult === 'win') return '1-0';
  if (blackResult === 'win') return '0-1';
  if (DRAW_RESULTS.has(whiteResult) || DRAW_RESULTS.has(blackResult)) return '1/2-1/2';
  return '*';
}

export function lichessResult(winner: string | undefined): GameResult {
  if (winner === 'white') return '1-0';
  if (winner === 'black') return '0-1';
  if (winner === undefined) return '1/2-1/2';
  return '*';
}

export interface PlatformGame {
  externalId: string;
  timeControl: TimeControl;
  playedAt: Date;
  whiteName: string;
  blackName: string;
  result: GameResult;
  pgn: string;
  whiteRating: number | null;
  blackRating: number | null;
}

export function selectNewest(games: PlatformGame[], limit: number): PlatformGame[] {
  return [...games].sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime()).slice(0, limit);
}
