'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DRILL_KIND_LABEL, type PublicRoadmap, type TrainingDesk } from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { Breadcrumb } from '@/components/dashboard/breadcrumb';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
import { ProgressMeter } from '@/components/dashboard/progress-meter';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { drillKindHref } from '@/lib/drill-kind';
import { fetchTrainingDesk, queueWriteup, trainingErrorMessage } from '@/lib/training';

export default function RoadmapPage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <RoadmapDesk />
        </AppShell>
      )}
    </DashboardGate>
  );
}

function RoadmapDesk() {
  const [desk, setDesk] = useState<TrainingDesk | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchTrainingDesk()
      .then(setDesk)
      .catch((err: unknown) => {
        showError(trainingErrorMessage(err));
        setDesk(null);
      });
  }, []);

  const roadmap = desk?.roadmap ?? null;

  return (
    <DashboardWell>
      <Breadcrumb items={[{ label: 'Roadmap' }]} />
      <PageIntro folio="Roadmap" title="The syllabus.">
        A workbook table of contents from your profile toward the next band — not a generic
        tactics book and not a cartoon trail.
      </PageIntro>

      {desk === undefined ? <p className="text-text-sub-600">Loading the syllabus…</p> : null}

      {desk && !roadmap ? (
        <EmptyPlate
          folio="Plate 00"
          title="No syllabus yet."
          action={
            <Button.Root
              type="button"
              className="w-fit"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void queueWriteup()
                  .then(() => fetchTrainingDesk().then(setDesk))
                  .catch((err: unknown) => showError(trainingErrorMessage(err)))
                  .finally(() => setBusy(false));
              }}
            >
              Write the profile first
            </Button.Root>
          }
        >
          A roadmap without a profile is a generic tactics book. Wait for the writeup.
        </EmptyPlate>
      ) : null}

      {roadmap ? <Syllabus roadmap={roadmap} desk={desk!} /> : null}
    </DashboardWell>
  );
}

function Syllabus({ roadmap, desk }: { roadmap: PublicRoadmap; desk: TrainingDesk }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="border-2 border-ink bg-gold/20 p-5 shadow-regular-xs">
        <p className="font-mono text-sm">Gold rule · {desk.progress.goalLabel}</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold">{roadmap.goldRule}</h2>
        <div className="mt-4 flex flex-col gap-3">
          <ProgressMeter
            done={desk.progress.stepsDone}
            total={desk.progress.stepsTotal}
            label="steps cleared"
          />
          <ProgressMeter
            done={desk.progress.drillsDone}
            total={desk.progress.drillsTotal}
            label="positions cleared"
          />
          <p className="font-mono text-sm">
            {desk.progress.drillsDue} due · {desk.progress.drillsDoneThisWeek} hits this week
          </p>
        </div>
        {desk.progress.leaksStillPresent.length > 0 ? (
          <p className="mt-3 text-sm leading-6">
            Still in recent games:{' '}
            {desk.progress.leaksStillPresent
              .map((item) => `${item.label} (${item.recentCount})`)
              .join(', ')}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6">No named leak in the last fifteen games.</p>
        )}
      </section>

      <ol className="flex flex-col gap-4">
        {roadmap.steps.map((step, index) => (
          <li
            key={step.id}
            id={`s${index + 1}`}
            className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs"
          >
            <p className="font-mono text-sm">
              s{index + 1} · {DRILL_KIND_LABEL[step.kind]} · {step.status}
            </p>
            <h3 className="mt-2 font-display text-xl font-extrabold">{step.title}</h3>
            <p className="mt-2 max-w-[62ch] text-base leading-7">{step.why}</p>
            <p className="mt-2 text-sm leading-6 text-text-sub-600">Done when: {step.doneWhen}</p>
            <div className="mt-3">
              <ProgressMeter
                done={step.drillsDone}
                total={step.drillsTotal}
                label="positions cleared"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button.Root asChild size="small" className="w-fit">
                <Link href={drillKindHref(step.kind)}>Open the set</Link>
              </Button.Root>
              {step.drillsDone > 0 ? (
                <Button.Root asChild variant="neutral" mode="stroke" size="small" className="w-fit">
                  <Link href={`${drillKindHref(step.kind)}?status=done`}>Cleared positions</Link>
                </Button.Root>
              ) : null}
              {step.evidenceGameIds.slice(0, 2).map((id) => (
                <Button.Root key={id} asChild variant="neutral" mode="stroke" size="small" className="w-fit">
                  <Link href={`/games/${id}`}>Cited game</Link>
                </Button.Root>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
