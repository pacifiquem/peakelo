import { DRILL_KIND_LABEL, type DrillKind } from '@peakelo/shared';

export const DRILL_KIND_SLUG: Record<DrillKind, string> = {
  blunder_preventer: 'blunder-preventer',
  replay_mistake: 'replay-mistake',
  defend_worse: 'defend-worse',
  convert_advantage: 'convert-advantage',
  make_plan: 'make-a-plan',
};

const SLUG_TO_KIND = Object.fromEntries(
  (Object.keys(DRILL_KIND_SLUG) as DrillKind[]).map((kind) => [DRILL_KIND_SLUG[kind], kind]),
) as Record<string, DrillKind>;

export function drillKindFromSlug(slug: string): DrillKind | null {
  return SLUG_TO_KIND[slug] ?? null;
}

export function drillKindHref(kind: DrillKind): string {
  return `/drills/${DRILL_KIND_SLUG[kind]}`;
}

export function drillKindLabel(kind: DrillKind): string {
  return DRILL_KIND_LABEL[kind];
}

export function instanceStem(stem: string, kind: DrillKind): string {
  const prefix = `${DRILL_KIND_LABEL[kind]}:`;
  if (stem.startsWith(prefix)) return stem.slice(prefix.length).trim();
  return stem;
}

export function stepIdToKind(stepId: string): DrillKind | null {
  return drillKindFromSlug(stepId);
}
