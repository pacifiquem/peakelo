import type { ParsedGameUrl } from '@peakelo/shared';

const LICHESS_HOSTS = new Set(['lichess.org', 'www.lichess.org']);
const CHESSCOM_HOSTS = new Set(['chess.com', 'www.chess.com']);

export function parseGameUrl(raw: string): ParsedGameUrl | null {
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  if (LICHESS_HOSTS.has(host)) return parseLichess(parsed);
  if (CHESSCOM_HOSTS.has(host)) return parseChesscom(parsed);
  return null;
}

function parseLichess(url: URL): ParsedGameUrl | null {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'game' && parts[1] === 'export' && parts[2]) {
    return lichessId(parts[2]);
  }
  if (parts[0]) return lichessId(parts[0]);
  return null;
}

function lichessId(value: string): ParsedGameUrl | null {
  const id = value.slice(0, 8);
  if (!/^[a-zA-Z0-9]{8}$/.test(id)) return null;
  return { source: 'lichess', externalId: id, kind: null };
}

function parseChesscom(url: URL): ParsedGameUrl | null {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'analysis' && parts[1] === 'game' && (parts[2] === 'live' || parts[2] === 'daily') && parts[3]) {
    return chesscomId(parts[2], parts[3]);
  }
  if (parts[0] === 'game' && (parts[1] === 'live' || parts[1] === 'daily') && parts[2]) {
    return chesscomId(parts[1], parts[2]);
  }
  if (parts[0] === 'live' && parts[1] === 'game' && parts[2]) {
    return chesscomId('live', parts[2]);
  }
  return null;
}

function chesscomId(kind: string, value: string): ParsedGameUrl | null {
  const id = value.replace(/\D/g, '');
  if (id.length < 6 || id.length > 20) return null;
  if (kind !== 'live' && kind !== 'daily') return null;
  return { source: 'chesscom', externalId: id, kind };
}
