import type {
  AnalyzedPly,
  BareProfile,
  Citation,
  CourseSkillBand,
  DrillKind,
  Overlooked,
  TrainingFocus,
  Writeup,
} from '@peakelo/shared';
import { doneWhenFor, kindFromStepId, kindsForBand, kindsForGoal, leakForKind } from './kinds';

export type AnalysisLookup = Map<string, AnalyzedPly[]>;

export type DraftDrill = {
  kind: DrillKind;
  stepId: string;
  fen: string;
  playerColor: 'white' | 'black';
  sourceGameId: string;
  sourcePly: number;
  stem: string;
  goalUci: string[];
  goalSan: string[];
  leak: Overlooked | null;
};

export type DraftStep = {
  id: string;
  kind: DrillKind;
  title: string;
  why: string;
  doneWhen: string;
  evidenceGameIds: string[];
  leak: Overlooked | null;
  drafts: DraftDrill[];
};

const MAX_DRILLS_PER_STEP = 4;
const MAX_PLAYER_GOAL_MOVES = 3;

export function materializeSyllabus(input: {
  writeup: Writeup;
  snapshot: BareProfile;
  analyses: AnalysisLookup;
  band: CourseSkillBand;
  goal: TrainingFocus;
  existingKeys?: Set<string>;
}): { goldRule: string; steps: DraftStep[] } {
  const allowedList = intersectKinds(kindsForBand(input.band), kindsForGoal(input.goal));
  const allowed = new Set(allowedList.length > 0 ? allowedList : kindsForBand(input.band));
  const existing = input.existingKeys ?? new Set<string>();
  const steps: DraftStep[] = [];
  const usedIds = new Set<string>();

  for (const item of input.writeup.now) {
    const kind = kindFromStepId(item.stepId);
    if (!allowed.has(kind)) continue;
    const stepId = uniqueStepId(item.stepId, usedIds);
    const drafts = draftsFromCitations({
      citations: item.citations,
      kind,
      stepId,
      why: item.why,
      analyses: input.analyses,
      existingKeys: existing,
    });
    if (drafts.length === 0) continue;
    steps.push({
      id: stepId,
      kind,
      title: item.title,
      why: item.why,
      doneWhen: doneWhenFor(kind),
      evidenceGameIds: unique(item.citations.map((citation) => citation.gameId)),
      leak: leakForKind(kind) ?? leakFromCitations(item.citations, input.snapshot),
      drafts,
    });
  }

  if (steps.length === 0) {
    const fallback = fallbackFromSnapshot(input.snapshot, input.analyses, allowed, existing);
    if (fallback) steps.push(fallback);
  }

  return {
    goldRule: steps[0]?.title ?? input.writeup.headline,
    steps,
  };
}

export function draftsFromCitations(input: {
  citations: Citation[];
  kind: DrillKind;
  stepId: string;
  why: string;
  analyses: AnalysisLookup;
  existingKeys: Set<string>;
}): DraftDrill[] {
  return input.citations
    .map((citation) => draftFromCitation(citation, input.kind, input.stepId, input.why, input.analyses))
    .filter((draft): draft is DraftDrill => Boolean(draft))
    .filter((draft) => !input.existingKeys.has(drillKey(draft)))
    .slice(0, MAX_DRILLS_PER_STEP);
}

export function drillKey(draft: Pick<DraftDrill, 'sourceGameId' | 'sourcePly' | 'kind'>): string {
  return `${draft.sourceGameId}:${draft.sourcePly}:${draft.kind}`;
}

function intersectKinds(left: DrillKind[], right: DrillKind[]): DrillKind[] {
  const allow = new Set(right);
  return left.filter((kind) => allow.has(kind));
}

function draftFromCitation(
  citation: Citation,
  kind: DrillKind,
  stepId: string,
  why: string,
  analyses: AnalysisLookup,
): DraftDrill | null {
  const ply = analyses.get(citation.gameId)?.find((item) => item.ply === citation.ply);
  if (!ply?.isPlayer || !ply.bestUci) return null;
  const line = goalLine(ply);
  if (line.uci.length === 0) return null;
  return {
    kind,
    stepId,
    fen: ply.fenBefore,
    playerColor: ply.color,
    sourceGameId: citation.gameId,
    sourcePly: citation.ply,
    stem: stemFor(kind, why, citation),
    goalUci: line.uci,
    goalSan: line.san,
    leak: leakForKind(kind) ?? ply.overlooked[0] ?? null,
  };
}

function goalLine(ply: AnalyzedPly): { uci: string[]; san: string[] } {
  const fromPv = ply.pvUci[0] === ply.bestUci;
  const uci = (fromPv ? ply.pvUci : [ply.bestUci, ...ply.pvUci]).slice(0, MAX_PLAYER_GOAL_MOVES * 2 - 1);
  const san = (fromPv ? ply.pvSan : [ply.bestSan, ...ply.pvSan]).slice(0, uci.length);
  return { uci, san };
}

function stemFor(_kind: DrillKind, why: string, citation: Citation): string {
  const idea = why.trim().replace(/\s+/g, ' ');
  return `${idea} Before ${citation.playedSan}, find ${citation.bestSan}.`;
}

function leakFromCitations(citations: Citation[], snapshot: BareProfile): Overlooked | null {
  for (const group of snapshot.mistakes) {
    if (group.citations.some((citation) => citations.some((item) => item.gameId === citation.gameId))) {
      return group.overlooked;
    }
  }
  return null;
}

function fallbackFromSnapshot(
  snapshot: BareProfile,
  analyses: AnalysisLookup,
  allowed: Set<DrillKind>,
  existing: Set<string>,
): DraftStep | null {
  const group = snapshot.mistakes[0];
  const kind = [...allowed][0];
  if (!group || !kind) return null;
  const drafts = group.citations
    .map((citation) =>
      draftFromCitation(
        citation,
        kind,
        kind.replaceAll('_', '-'),
        'This is the most common leak in the snapshot.',
        analyses,
      ),
    )
    .filter((draft): draft is DraftDrill => Boolean(draft))
    .filter((draft) => !existing.has(drillKey(draft)))
    .slice(0, MAX_DRILLS_PER_STEP);
  if (drafts.length === 0) return null;
  return {
    id: kind.replaceAll('_', '-'),
    kind,
    title: 'Stop the most common leak',
    why: 'The snapshot names this leak first.',
    doneWhen: doneWhenFor(kind),
    evidenceGameIds: unique(group.citations.map((citation) => citation.gameId)),
    leak: group.overlooked,
    drafts,
  };
}

function uniqueStepId(stepId: string, used: Set<string>): string {
  if (!used.has(stepId)) {
    used.add(stepId);
    return stepId;
  }
  let n = 2;
  let next = `${stepId}-${n}`;
  while (used.has(next)) {
    n += 1;
    next = `${stepId}-${n}`;
  }
  used.add(next);
  return next;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
