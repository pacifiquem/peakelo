import type { BareProfile, CourseSkillBand, DrillKind, Overlooked, TrainingFocus } from '@peakelo/shared';

export const STEP_KIND: Record<string, DrillKind> = {
  'blunder-preventer': 'blunder_preventer',
  blunder_preventer: 'blunder_preventer',
  'replay-mistake': 'replay_mistake',
  replay_mistake: 'replay_mistake',
  'defend-worse': 'defend_worse',
  defend_worse: 'defend_worse',
  'convert-advantage': 'convert_advantage',
  convert_advantage: 'convert_advantage',
  'make-a-plan': 'make_plan',
  make_plan: 'make_plan',
};

const KIND_SLUGS = [
  'blunder-preventer',
  'replay-mistake',
  'defend-worse',
  'convert-advantage',
  'make-a-plan',
] as const;

export function kindFromStepId(stepId: string): DrillKind {
  const key = stepId.trim().toLowerCase().replace(/[_\s]+/g, '-');
  const exact = STEP_KIND[key] ?? STEP_KIND[stepId];
  if (exact) return exact;
  const slugs = [...KIND_SLUGS].sort((a, b) => b.length - a.length);
  for (const slug of slugs) {
    if (key === slug || key.startsWith(`${slug}-`)) {
      const kind = STEP_KIND[slug];
      if (kind) return kind;
    }
  }
  return 'replay_mistake';
}

export function kindsForBand(band: CourseSkillBand): DrillKind[] {
  switch (band) {
    case 'under400':
    case 'from400to1200':
      return ['blunder_preventer', 'replay_mistake'];
    case 'from1200to1600':
      return ['blunder_preventer', 'replay_mistake', 'make_plan'];
    case 'from1600to2000':
      return ['blunder_preventer', 'replay_mistake', 'make_plan', 'convert_advantage', 'defend_worse'];
    case 'over2000':
      return ['convert_advantage', 'defend_worse', 'make_plan', 'replay_mistake'];
  }
}

export function kindsForGoal(goal: TrainingFocus): DrillKind[] {
  switch (goal) {
    case 'tactics':
      return ['replay_mistake', 'blunder_preventer'];
    case 'blunders':
      return ['blunder_preventer', 'replay_mistake'];
    case 'openings':
      return ['make_plan', 'replay_mistake'];
    case 'endgames':
      return ['convert_advantage', 'defend_worse'];
    case 'positional':
      return ['make_plan', 'convert_advantage'];
    case 'rating':
    case 'unknown':
      return ['blunder_preventer', 'replay_mistake', 'make_plan', 'convert_advantage', 'defend_worse'];
  }
}

export function resolveTrainingFocus(requested: TrainingFocus, snapshot: BareProfile): TrainingFocus {
  if (requested !== 'unknown') return requested;

  const hang = snapshot.mistakes.find((row) => row.overlooked === 'hanging_piece');
  const combo =
    snapshot.mistakes.find((row) => row.overlooked === 'missed_combination') ??
    snapshot.tactics.find((row) => row.depth >= 3);
  const hangScore = hang ? hang.count * hang.avgCpl : 0;
  const comboScore =
    combo && 'count' in combo && 'avgCpl' in combo
      ? combo.count * combo.avgCpl
      : combo && 'missed' in combo
        ? combo.missed * 200
        : 0;
  const end = snapshot.phases.endgame;
  const mid = snapshot.phases.middlegame;
  const endScore = end && mid && end.blunderRate > mid.blunderRate ? end.blunderRate * 800 : 0;
  const weakOpening = [...snapshot.openings].sort((a, b) => b.acpl - a.acpl)[0];
  const openScore = weakOpening && weakOpening.games >= 3 ? weakOpening.acpl * weakOpening.games : 0;

  const ranked: Array<{ focus: TrainingFocus; score: number }> = [
    { focus: 'blunders' as const, score: hangScore },
    { focus: 'tactics' as const, score: comboScore },
    { focus: 'endgames' as const, score: endScore },
    { focus: 'openings' as const, score: openScore },
  ];
  ranked.sort((a, b) => b.score - a.score);

  return ranked[0] && ranked[0].score > 0 ? ranked[0].focus : 'rating';
}

export function leakForKind(kind: DrillKind): Overlooked | null {
  switch (kind) {
    case 'blunder_preventer':
      return 'hanging_piece';
    case 'replay_mistake':
      return 'missed_combination';
    case 'defend_worse':
    case 'convert_advantage':
    case 'make_plan':
      return null;
  }
}

export function doneWhenFor(kind: DrillKind): string {
  switch (kind) {
    case 'blunder_preventer':
      return 'You stop hanging a piece for free in the next 15 rated games.';
    case 'replay_mistake':
      return 'The same miss does not repeat in the next 15 games.';
    case 'defend_worse':
      return 'You find one stubborn idea when worse, instead of collapsing.';
    case 'convert_advantage':
      return 'A large edge does not drain to a draw or a loss in the next 15 games.';
    case 'make_plan':
      return 'Against a quiet setup you play a central break instead of shuffling.';
  }
}
