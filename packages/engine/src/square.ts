export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export type File = (typeof FILES)[number];
export type Rank = (typeof RANKS)[number];
export type Square = `${File}${Rank}`;
export type Color = 'white' | 'black';

const FILE_SET = new Set<string>(FILES);
const RANK_SET = new Set<string>(RANKS);

export function isSquare(value: string): value is Square {
  return value.length === 2 && FILE_SET.has(value[0]!) && RANK_SET.has(value[1]!);
}
