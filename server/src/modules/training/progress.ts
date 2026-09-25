import {
  DRILL_KIND_LABEL,
  type DrillKind,
  type DrillSetProgress,
  type DrillStatus,
  type PublicRoadmap,
} from '@peakelo/shared';

export type DrillProgressRow = {
  kind: DrillKind;
  stepId: string;
  status: DrillStatus;
};

export function attachDrillProgress(roadmap: PublicRoadmap, drills: DrillProgressRow[]): PublicRoadmap {
  const byStep = new Map<string, { done: number; total: number }>();
  for (const drill of drills) {
    const current = byStep.get(drill.stepId) ?? { done: 0, total: 0 };
    current.total += 1;
    if (drill.status === 'done') current.done += 1;
    byStep.set(drill.stepId, current);
  }
  return {
    ...roadmap,
    steps: roadmap.steps.map((step) => {
      const counts = byStep.get(step.id) ?? { done: 0, total: step.drillIds.length };
      return {
        ...step,
        drillsDone: counts.done,
        drillsTotal: Math.max(counts.total, step.drillIds.length),
      };
    }),
  };
}

export function summarizeSets(drills: DrillProgressRow[]): DrillSetProgress[] {
  const byKind = new Map<DrillKind, { due: number; done: number; total: number }>();
  for (const drill of drills) {
    const current = byKind.get(drill.kind) ?? { due: 0, done: 0, total: 0 };
    current.total += 1;
    if (drill.status === 'done') current.done += 1;
    if (drill.status === 'due' || drill.status === 'assigned') current.due += 1;
    byKind.set(drill.kind, current);
  }
  return (Object.keys(DRILL_KIND_LABEL) as DrillKind[])
    .map((kind) => {
      const counts = byKind.get(kind);
      if (!counts) return null;
      return { kind, ...counts };
    })
    .filter((row): row is DrillSetProgress => row !== null);
}

export function countCompleted(drills: DrillProgressRow[]): { done: number; total: number; due: number } {
  let done = 0;
  let due = 0;
  for (const drill of drills) {
    if (drill.status === 'done') done += 1;
    if (drill.status === 'due' || drill.status === 'assigned') due += 1;
  }
  return { done, due, total: drills.length };
}
