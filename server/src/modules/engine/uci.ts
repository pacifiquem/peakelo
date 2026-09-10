export type UciScore = { kind: 'cp' | 'mate'; value: number };

export type ParsedUciInfo = {
  depth: number;
  multipv: number;
  score: UciScore;
  pvUci: string[];
};

export function parseUciInfoLine(line: string): ParsedUciInfo | null {
  if (!line.startsWith('info ')) return null;
  const score = /(?:^|\s)score\s+(cp|mate)\s+(-?\d+)/.exec(line);
  if (!score || (score[1] !== 'cp' && score[1] !== 'mate') || score[2] === undefined) {
    return null;
  }
  const depth = /(?:^|\s)depth\s+(\d+)/.exec(line);
  const multipv = /(?:^|\s)multipv\s+(\d+)/.exec(line);
  const pv = /(?:^|\s)pv\s+(.+)$/.exec(line);
  return {
    depth: depth?.[1] ? Number(depth[1]) : 0,
    multipv: multipv?.[1] ? Number(multipv[1]) : 1,
    score: { kind: score[1], value: Number(score[2]) },
    pvUci: pv?.[1]?.trim().split(/\s+/).filter(Boolean) ?? [],
  };
}

export function parseBestmove(line: string): string | null {
  const match = /^bestmove\s+(\S+)/.exec(line);
  return match?.[1] ?? null;
}

export function sideToMove(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w';
}

export function whitePositiveScore(score: UciScore, side: 'w' | 'b'): UciScore {
  if (side === 'w') return score;
  return { kind: score.kind, value: -score.value };
}
