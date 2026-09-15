import type { BareProfile, Overlooked, PublicRoadmap, RoadmapStep } from '@peakelo/shared';
import { REINFORCE_RECENT_GAMES } from '@peakelo/shared';

export type LeakCount = { overlooked: Overlooked; recentCount: number };

export function countRecentLeaks(
  snapshot: BareProfile,
  recentGameIds: Set<string>,
): LeakCount[] {
  return snapshot.mistakes.map((group) => ({
    overlooked: group.overlooked,
    recentCount: group.citations.filter((citation) => recentGameIds.has(citation.gameId)).length,
  }));
}

export function applyReinforcement(input: {
  roadmap: PublicRoadmap;
  leaks: LeakCount[];
  hitsByStep: Map<string, number>;
}): PublicRoadmap {
  const leakMap = new Map(input.leaks.map((item) => [item.overlooked, item.recentCount]));
  const steps = input.roadmap.steps.map((step) => reinforceStep(step, leakMap, input.hitsByStep.get(step.id) ?? 0));
  const firstOpen = steps.find((step) => step.status !== 'done');
  return {
    ...input.roadmap,
    steps: steps.map((step) => ({
      ...step,
      status: step.status === 'done' ? 'done' : step.id === firstOpen?.id ? 'current' : 'upcoming',
    })),
  };
}

export function shouldAddMoreDrills(step: RoadmapStep, leaks: LeakCount[], dueCount: number): boolean {
  if (step.status === 'done') return false;
  if (!step.leak) return dueCount === 0;
  const recent = leaks.find((item) => item.overlooked === step.leak)?.recentCount ?? 0;
  return recent > 0 && dueCount < 2;
}

export function shouldRetireStep(step: RoadmapStep, leaks: LeakCount[], hits: number): boolean {
  if (!step.leak) return hits >= 3;
  const recent = leaks.find((item) => item.overlooked === step.leak)?.recentCount ?? 0;
  return recent === 0 && hits >= 2;
}

function reinforceStep(
  step: RoadmapStep,
  leakMap: Map<Overlooked, number>,
  hits: number,
): RoadmapStep {
  if (!step.leak) {
    return hits >= 3 ? { ...step, status: 'done' } : step;
  }
  const recent = leakMap.get(step.leak) ?? 0;
  if (recent === 0 && hits >= 2) return { ...step, status: 'done' };
  return step;
}

export function recentGameIds<T extends { id: string }>(games: T[], limit = REINFORCE_RECENT_GAMES): Set<string> {
  return new Set(games.slice(0, limit).map((game) => game.id));
}
