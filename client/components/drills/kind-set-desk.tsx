'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DRILL_KIND_LABEL,
  type DrillKind,
  type PaginatedResult,
  type PublicDrill,
} from '@peakelo/shared';

import { Breadcrumb } from '@/components/dashboard/breadcrumb';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { Pager } from '@/components/dashboard/pager';
import { ProgressMeter } from '@/components/dashboard/progress-meter';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { useDeskQuery } from '@/lib/desk-query';
import { instanceStem } from '@/lib/drill-kind';
import { fetchDrills, fetchTrainingDesk, trainingErrorMessage } from '@/lib/training';

export function KindSetDesk({ kind }: { kind: DrillKind }) {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-text-sub-600">Loading the set…</p>}>
      <KindSet kind={kind} />
    </Suspense>
  );
}

function KindSet({ kind }: { kind: DrillKind }) {
  const { params, replace } = useDeskQuery();
  const status = params.get('status') === 'done' ? 'done' : 'due';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const requestKey = `${kind}:${status}:${page}`;
  const [rows, setRows] = useState<PaginatedResult<PublicDrill> | null | undefined>(undefined);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const [cleared, setCleared] = useState({ done: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    void fetchDrills({ kind, status, page, pageSize: 20 })
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setLoadedKey(requestKey);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        showError(trainingErrorMessage(err));
        setRows(null);
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, page, requestKey, status]);

  useEffect(() => {
    let cancelled = false;
    void fetchTrainingDesk()
      .then((desk) => {
        if (cancelled) return;
        const step = desk.roadmap?.steps.find((item) => item.kind === kind);
        const set = desk.progress.sets.find((item) => item.kind === kind);
        setWhy(step?.why ?? null);
        setCleared({ done: set?.done ?? 0, total: set?.total ?? 0 });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const loaded = loadedKey === requestKey;

  return (
    <DashboardWell>
      <Breadcrumb
        items={[{ label: 'Drills', href: '/drills' }, { label: DRILL_KIND_LABEL[kind] }]}
      />
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold">{DRILL_KIND_LABEL[kind]}</h1>
        {why ? <p className="max-w-[62ch] text-base leading-7 text-text-strong-950">{why}</p> : null}
        <span className="h-1 w-16 bg-gold" aria-hidden />
        <p className="max-w-[62ch] text-sm leading-6 text-text-sub-600">
          Cleared positions stay on Done, so you can see what you&apos;ve already solved.
        </p>
        <ProgressMeter done={cleared.done} total={cleared.total} label="positions cleared" />
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Set filter">
        <Button.Root
          type="button"
          size="small"
          variant={status === 'due' ? 'primary' : 'neutral'}
          mode={status === 'due' ? 'filled' : 'stroke'}
          className="w-fit"
          onClick={() => replace({ status: null }, true)}
        >
          Due
        </Button.Root>
        <Button.Root
          type="button"
          size="small"
          variant={status === 'done' ? 'primary' : 'neutral'}
          mode={status === 'done' ? 'filled' : 'stroke'}
          className="w-fit"
          onClick={() => replace({ status: 'done' }, true)}
        >
          Done
        </Button.Root>
      </div>

      {!loaded ? <p className="text-text-sub-600">Loading the set…</p> : null}

      {loaded && rows === null ? (
        <EmptyPlate folio="Drills" title="Could not load this set.">
          Try again in a moment.
        </EmptyPlate>
      ) : null}

      {loaded && rows && rows.data.length === 0 ? (
        <EmptyPlate
          folio={DRILL_KIND_LABEL[kind]}
          title={status === 'done' ? 'Nothing cleared yet.' : 'Nothing waiting in this set.'}
          action={
            <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
              <Link href="/drills">All sets</Link>
            </Button.Root>
          }
        >
          {status === 'done'
            ? 'Finish a position and it shows up here, with the time you cleared it.'
            : 'When I name a leak like this, the positions from your games show up here.'}
        </EmptyPlate>
      ) : null}

      {loaded && rows && rows.data.length > 0 ? (
        <div className="flex flex-col gap-4">
          <p className="font-mono text-sm text-text-sub-600">
            {rows.pagination.total} {status} in this set
          </p>
          <ol className="flex flex-col gap-3">
            {rows.data.map((drill, index) => (
              <li key={drill.id}>
                <Link
                  href={`/drills/${drill.id}`}
                  className="flex flex-col border-2 border-l-4 border-ink border-l-magenta bg-bg-white-0 p-4 shadow-regular-xs hover:bg-bg-weak-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <p className="font-mono text-sm text-text-sub-600">
                    {String(index + 1 + (rows.pagination.page - 1) * rows.pagination.pageSize).padStart(2, '0')}
                    {status === 'done'
                      ? ` · ${clearedWhen(drill.lastAttemptAt)}`
                      : drill.lastResult
                        ? ` · last ${drill.lastResult}`
                        : ''}
                    {` · ${drill.hitCount}/${drill.attemptCount} hits`}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-extrabold">
                    {instanceStem(drill.stem, kind)}
                  </h2>
                  <p className="mt-2 font-display text-sm font-bold underline decoration-2 underline-offset-4">
                    {status === 'done' ? 'Open the cleared position' : 'Replay this position'}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
          <Pager
            page={rows.pagination.page}
            totalPages={rows.pagination.totalPages}
            onPage={(next) => replace({ page: next <= 1 ? null : String(next) })}
          />
        </div>
      ) : null}
    </DashboardWell>
  );
}

function clearedWhen(iso: string | null): string {
  if (!iso) return 'cleared';
  return `cleared ${new Date(iso).toLocaleString()}`;
}
