'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DRILL_KIND_LABEL,
  type DrillKind,
  type PaginatedResult,
  type PublicDrill,
} from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { fetchDrills, trainingErrorMessage } from '@/lib/training';

export default function DrillsPage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <QueueDesk />
        </AppShell>
      )}
    </DashboardGate>
  );
}

function QueueDesk() {
  const [status, setStatus] = useState<'due' | 'done' | 'all'>('due');
  const [kind, setKind] = useState<DrillKind | 'all'>('all');
  const [rows, setRows] = useState<PaginatedResult<PublicDrill> | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void fetchDrills({ status, kind: kind === 'all' ? undefined : kind })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        showError(trainingErrorMessage(err));
        setRows(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status, kind]);

  return (
    <DashboardWell>
      <PageIntro folio="Drills" title="Assigned work.">
        A practice queue from the roadmap — not Puzzle Storm, not a public mates-in-two bucket.
      </PageIntro>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Queue filter">
        {(['due', 'done', 'all'] as const).map((item) => (
          <Button.Root
            key={item}
            type="button"
            size="small"
            variant={status === item ? 'primary' : 'neutral'}
            mode={status === item ? 'filled' : 'stroke'}
            className="w-fit capitalize"
            onClick={() => setStatus(item)}
          >
            {item}
          </Button.Root>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Type filter">
        <Button.Root
          type="button"
          size="small"
          variant={kind === 'all' ? 'primary' : 'neutral'}
          mode={kind === 'all' ? 'filled' : 'stroke'}
          className="w-fit"
          onClick={() => setKind('all')}
        >
          All types
        </Button.Root>
        {(Object.keys(DRILL_KIND_LABEL) as DrillKind[]).map((item) => (
          <Button.Root
            key={item}
            type="button"
            size="small"
            variant={kind === item ? 'primary' : 'neutral'}
            mode={kind === item ? 'filled' : 'stroke'}
            className="w-fit"
            onClick={() => setKind(item)}
          >
            {DRILL_KIND_LABEL[item]}
          </Button.Root>
        ))}
      </div>

      {rows === undefined ? <p className="text-text-sub-600">Loading the queue…</p> : null}

      {rows && rows.data.length === 0 ? (
        <EmptyPlate
          folio="Plate 00"
          title="No drill until the roadmap names a leak."
          action={
            <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
              <Link href="/roadmap">Open the syllabus</Link>
            </Button.Root>
          }
        >
          We will not serve random puzzles and call them yours. When a step exists, it lands here
          grouped by type.
        </EmptyPlate>
      ) : null}

      {rows && rows.data.length > 0
        ? (Object.keys(DRILL_KIND_LABEL) as DrillKind[]).map((group) => {
            const items = rows.data.filter((drill) => drill.kind === group);
            if (items.length === 0) return null;
            return (
              <section key={group} className="border-2 border-ink bg-bg-white-0 shadow-regular-xs">
                <header className="border-b-2 border-ink bg-bg-weak-50 px-4 py-2">
                  <p className="font-mono text-sm">{DRILL_KIND_LABEL[group]}</p>
                </header>
                <ul className="divide-y-2 divide-ink">
                  {items.map((drill) => (
                    <li key={drill.id} className="odd:bg-bg-white-0 even:bg-bg-weak-50">
                      <Link
                        href={`/drills/${drill.id}`}
                        className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between"
                      >
                        <span className="font-display font-bold">{drill.stem}</span>
                        <span className="font-mono text-sm">
                          {drill.status}
                          {drill.lastResult ? ` · last ${drill.lastResult}` : ''} · {drill.hitCount}/
                          {drill.attemptCount} hits
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        : null}
    </DashboardWell>
  );
}
