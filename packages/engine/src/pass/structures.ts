const FILES = 'abcdefgh';

export type PawnSkeleton = {
  white: bigint;
  black: bigint;
};

export function pawnSkeleton(fen: string): PawnSkeleton | null {
  const board = fen.split(' ')[0] ?? '';
  const ranks = board.split('/');
  if (ranks.length !== 8) return null;
  let white = 0n;
  let black = 0n;
  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    const rank = 8 - rankIndex;
    let file = 0;
    for (const char of ranks[rankIndex] ?? '') {
      if (char >= '1' && char <= '8') {
        file += Number(char);
        continue;
      }
      if (file > 7) return null;
      const bit = 1n << BigInt(file * 8 + (rank - 1));
      if (char === 'P') white |= bit;
      else if (char === 'p') black |= bit;
      file += 1;
    }
    if (file !== 8) return null;
  }
  return { white, black };
}

export function pawnDistance(left: PawnSkeleton, right: PawnSkeleton): { center: number; wing: number } {
  const diff = (left.white ^ right.white) | (left.black ^ right.black);
  let center = 0;
  let wing = 0;
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const bit = 1n << BigInt(file * 8 + rank);
      if ((diff & bit) === 0n) continue;
      if (file >= 2 && file <= 5) center += 1;
      else wing += 1;
    }
  }
  return { center, wing };
}

export function samePawnStructure(left: PawnSkeleton, right: PawnSkeleton): boolean {
  const distance = pawnDistance(left, right);
  return distance.center === 0 && distance.wing <= 2;
}

export function structureLabel(skeleton: PawnSkeleton): string {
  const facts = [
    ...pawnFacts('White', skeleton.white, skeleton.black, 'up'),
    ...pawnFacts('Black', skeleton.black, skeleton.white, 'down'),
  ];
  if (facts.length === 0) return 'Same central pawns';
  return facts.slice(0, 4).join(' · ');
}

export function clusterBySkeleton<T>(items: T[], skeletonOf: (item: T) => PawnSkeleton): T[][] {
  const clusters: Array<{ head: PawnSkeleton; items: T[] }> = [];
  for (const item of items) {
    const skeleton = skeletonOf(item);
    const cluster = clusters.find((candidate) => samePawnStructure(candidate.head, skeleton));
    if (cluster) cluster.items.push(item);
    else clusters.push({ head: skeleton, items: [item] });
  }
  return clusters.map((cluster) => cluster.items);
}

function pawnFacts(
  side: 'White' | 'Black',
  own: bigint,
  enemy: bigint,
  direction: 'up' | 'down',
): string[] {
  const facts: string[] = [];
  const byFile = ranksByFile(own);
  for (let file = 0; file < 8; file += 1) {
    const ranks = byFile[file] ?? [];
    if (ranks.length >= 2) {
      facts.push(`${side} doubled pawns on the ${FILES[file]}-file`);
    }
    for (const rank of ranks) {
      const neighbors = (byFile[file - 1]?.length ?? 0) + (byFile[file + 1]?.length ?? 0);
      const passed = isPassed(file, rank, enemy, direction);
      if (neighbors === 0) {
        facts.push(`${side} isolated pawn on ${FILES[file]}${rank}`);
      }
      if (passed) facts.push(`${side} passed pawn on ${FILES[file]}${rank}`);
    }
  }
  return facts;
}

function isPassed(file: number, rank: number, enemy: bigint, direction: 'up' | 'down'): boolean {
  const enemyRanks = ranksByFile(enemy);
  for (const adjacent of [file - 1, file, file + 1]) {
    for (const enemyRank of enemyRanks[adjacent] ?? []) {
      if (direction === 'up' && enemyRank > rank) return false;
      if (direction === 'down' && enemyRank < rank) return false;
    }
  }
  return true;
}

function ranksByFile(bits: bigint): number[][] {
  const files: number[][] = Array.from({ length: 8 }, () => []);
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 1; rank <= 8; rank += 1) {
      const bit = 1n << BigInt(file * 8 + (rank - 1));
      if ((bits & bit) !== 0n) files[file]?.push(rank);
    }
  }
  return files;
}
