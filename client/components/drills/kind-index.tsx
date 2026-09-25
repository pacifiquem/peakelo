'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DRILL_KIND_LABEL, type DrillKind, type TrainingDesk } from '@peakelo/shared';

import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { ProgressMeter } from '@/components/dashboard/progress-meter';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { drillKindHref } from '@/lib/drill-kind';
import { fetchTrainingDesk, trainingErrorMessage } from '@/lib/training';

type KindSummary = {
  kind: DrillKind;
  why: string;
  due: number;
  done: number;
  total: number;
};

export function KindIndex() {
  const [desk, setDesk] = useState<TrainingDesk | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void fetchTrainingDesk()
      .then((data) => {
        if (!cancelled) setDesk(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        showError(trainingErrorMessage(err));
        setDesk(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (desk === undefined) return <p className="text-text-sub-600">Loading the sets…</p>;

  if (desk === null) {
    return (
      <EmptyPlate folio="Drills" title="Could not load the sets.">
        Try again in a moment.
      </EmptyPlate>
    );
  }

  const rows = rowsFromDesk(desk);

  if (rows.length === 0) {
    return (
      <EmptyPlate
        folio="Plate 00"
        title="No drill until the roadmap names a leak."
        action={
          <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
            <Link href="/roadmap">Open the syllabus</Link>
          </Button.Root>
        }
      >
        We will not serve random puzzles and call them yours. When a step exists, it lands here as
        one set — not a pile of the same label.
      </EmptyPlate>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ProgressMeter
        done={desk.progress.drillsDone}
        total={desk.progress.drillsTotal}
        label="positions cleared"
      />
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.kind}>
            <Link
              href={drillKindHref(row.kind)}
              className="block border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs hover:bg-bg-weak-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <ProgressMeter done={row.done} total={row.total} label="cleared" />
              <h2 className="mt-3 font-display text-2xl font-extrabold">{DRILL_KIND_LABEL[row.kind]}</h2>
              <p className="mt-2 max-w-[62ch] text-base leading-7 text-text-strong-950">{row.why}</p>
              <p className="mt-3 font-mono text-sm text-text-sub-600">
                {row.due} due · {row.done} cleared
              </p>
              <p className="mt-3 font-display text-sm font-bold underline decoration-2 underline-offset-4">
                Open the set
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function rowsFromDesk(desk: TrainingDesk): KindSummary[] {
  const byKind = new Map(desk.progress.sets.map((item) => [item.kind, item]));
  const kinds = [
    ...desk.progress.sets.map((item) => item.kind),
    ...(desk.roadmap?.steps.map((step) => step.kind) ?? []),
  ].filter((kind, index, all) => all.indexOf(kind) === index);

  return kinds.map((kind) => {
    const counts = byKind.get(kind);
    const step = desk.roadmap?.steps.find((item) => item.kind === kind);
    return {
      kind,
      why: step?.why ?? defaultWhy(kind),
      due: counts?.due ?? 0,
      done: counts?.done ?? 0,
      total: counts?.total ?? 0,
    };
  });
}

function defaultWhy(kind: DrillKind): string {
  if (kind === 'blunder_preventer') {
    return 'Scan checks and captures before you move, on positions from your own games.';
  }
  if (kind === 'replay_mistake') {
    return 'Replay the miss from a game you already played. Name the move you should have found.';
  }
  if (kind === 'defend_worse') {
    return 'Hold a worse position from one of your losses.';
  }
  if (kind === 'convert_advantage') {
    return 'Finish a better position you dumped.';
  }
  return 'Find the plan in a structure you actually reach.';
}
