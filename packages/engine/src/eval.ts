export type EvalScore = { kind: 'cp' | 'mate'; value: number };

export type EngineLine = {
  uci: string;
  score: EvalScore;
  pvUci: string[];
};

export type Judgment = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

const MATE_CP = 10_000;
const MATE_STEP = 10;

export function scoreToCp(score: EvalScore): number {
  if (score.kind === 'cp') return score.value;
  const magnitude = Math.max(0, MATE_CP - MATE_STEP * Math.abs(score.value));
  return score.value >= 0 ? magnitude : -magnitude;
}

export function cplFromScores(best: EvalScore, played: EvalScore, mover: 'white' | 'black'): number {
  const bestCp = scoreToCp(best);
  const playedCp = scoreToCp(played);
  const loss = mover === 'white' ? bestCp - playedCp : playedCp - bestCp;
  return Math.max(0, loss);
}

export function judgmentFromCpl(cpl: number): Judgment {
  if (cpl <= 10) return 'best';
  if (cpl <= 49) return 'good';
  if (cpl <= 99) return 'inaccuracy';
  if (cpl <= 299) return 'mistake';
  return 'blunder';
}
