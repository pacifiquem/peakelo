'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicRoadmap, TrainingDesk } from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { Breadcrumb } from '@/components/dashboard/breadcrumb';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
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
      <PageIntro folio="Roadmap" title="What to work on.">
        Steps from your profile toward the next level. Not a generic tactics book.
      </PageIntro>

      {desk === undefined ? <p className="text-text-sub-600">Loading your roadmap…</p> : null}

      {desk && !roadmap ? (
        <EmptyPlate
          folio="Roadmap"
          title="No roadmap yet."
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
              Write my profile
            </Button.Root>
          }
        >
          I need your writeup before I can tell you what to practice. Otherwise this is just a
          tactics book.
        </EmptyPlate>
      ) : null}

      {roadmap ? <Syllabus roadmap={roadmap} desk={desk!} /> : null}
    </DashboardWell>
  );
}

function Syllabus({ roadmap, desk }: { roadmap: PublicRoadmap; desk: TrainingDesk }) {
  const current = roadmap.steps.find((step) => step.status === 'current');
  const [openId, setOpenId] = useState<string | null>(current?.id ?? null);

  return (
    <div className="flex flex-col gap-6">
      <section className="border-2 border-t-4 border-ink border-t-gold bg-bg-white-0 p-5 shadow-regular-sm">
        <p className="font-mono text-sm">The rule for now</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold">{roadmap.goldRule}</h2>
        <p className="mt-3 font-mono text-sm">
          {desk.progress.drillsDone}/{desk.progress.drillsTotal} positions
        </p>
      </section>

      <ol className="flex flex-col gap-2">
        {roadmap.steps.map((step, index) => {
          const open = openId === step.id;
          const mark =
            step.status === 'current' ? 'bg-gold' : step.status === 'done' ? 'bg-cyan' : 'bg-ink/25';
          return (
            <li key={step.id} id={`s${index + 1}`} className="border-2 border-ink bg-bg-white-0 shadow-regular-xs">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : step.id)}
              >
                <span className="flex items-center gap-3">
                  <span className={`size-2.5 shrink-0 ${mark}`} aria-hidden />
                  <span className="font-display text-lg font-extrabold">{step.title}</span>
                </span>
                <span className="font-mono text-sm">
                  {step.drillsDone}/{step.drillsTotal}
                </span>
              </button>
              {open ? (
                <div className="border-t-2 border-ink px-4 py-4">
                  <p className="max-w-[62ch] text-base leading-7">{step.why}</p>
                  {step.doneWhen !== step.why ? (
                    <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-sub-600">{step.doneWhen}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button.Root asChild size="small" className="w-fit">
                      <Link href={drillKindHref(step.kind)}>Start</Link>
                    </Button.Root>
                    {step.evidenceGameIds[0] ? (
                      <Button.Root asChild variant="neutral" mode="stroke" size="small" className="w-fit">
                        <Link href={`/games/${step.evidenceGameIds[0]}`}>See a game</Link>
                      </Button.Root>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
