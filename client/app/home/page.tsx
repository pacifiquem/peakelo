'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DRILL_KIND_LABEL,
  gameSourcesFromAccounts,
  type PaginatedResult,
  type PublicGame,
  type TrainingDesk,
} from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { isEnginePassActive, passGameTotal } from '@/lib/engine-pass';
import { fetchTrainingDesk } from '@/lib/training';

export default function HomePage() {
  return (
    <DashboardGate>
      {(user) => <HomeDesk user={user} />}
    </DashboardGate>
  );
}

function HomeDesk({ user }: { user: Parameters<typeof AppShell>[0]['user'] }) {
  const [games, setGames] = useState<PaginatedResult<PublicGame> | null>(null);
  const [desk, setDesk] = useState<TrainingDesk | null>(null);
  const source = (user.gameSources ?? gameSourcesFromAccounts(user.accounts))[0];

  useEffect(() => {
    if (!source) return;
    void api<PaginatedResult<PublicGame>>(`/games?page=1&pageSize=3&source=${source}`)
      .then(setGames)
      .catch((err: unknown) => {
        showError(err instanceof Error ? err.message : 'Could not load games');
      });
  }, [source]);

  useEffect(() => {
    void fetchTrainingDesk()
      .then(setDesk)
      .catch((err: unknown) => showError(err instanceof Error ? err.message : 'Could not load training'));
  }, [user.enginePass.status]);

  useEffect(() => {
    if (desk?.writeup.status !== 'queued' && desk?.writeup.status !== 'running') return;
    const timer = window.setInterval(() => {
      void fetchTrainingDesk()
        .then(setDesk)
        .catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [desk?.writeup.status]);

  const waiting = games?.data ?? [];
  const plate = plate00(user, waiting.length, desk);

  return (
    <AppShell user={user}>
      <DashboardWell>
        <PageIntro folio="Home" title="On the desk.">
          One next action. The writeup, the roadmap, and the drills wait until we have actually
          read your games.
        </PageIntro>

        <EmptyPlate folio="Plate 00" title={plate.title}>
          {plate.body}
        </EmptyPlate>

        {waiting.length > 0 ? (
          <section className="border-2 border-ink bg-bg-white-0 shadow-regular-xs">
            <header className="border-b-2 border-ink bg-bg-weak-50 px-4 py-2">
              <p className="font-mono text-sm font-medium text-text-strong-950">
                {desk?.writeup.document ? 'Waiting on you' : 'Waiting on a writeup'}
              </p>
            </header>
            <ul className="divide-y-2 divide-ink">
              {waiting.map((game) => (
                <li key={game.id} className="odd:bg-bg-white-0 even:bg-bg-weak-50">
                  <Link
                    href={`/games/${game.id}`}
                    className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <span className="font-display font-bold">
                      {game.whiteName} vs {game.blackName}
                    </span>
                    <span className="font-mono text-sm text-text-strong-950">
                      you as {game.userColor} · {game.result} · {game.timeControl}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {desk?.writeup.document ? (
          <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
            <p className="font-mono text-sm text-text-sub-600">Headline</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">{desk.writeup.document.headline}</h2>
            <p className="mt-2 font-mono text-sm">
              Goal: {desk.progress.goalLabel} · {desk.progress.stepsDone}/{desk.progress.stepsTotal} steps ·{' '}
              {desk.progress.drillsDue} due
            </p>
          </section>
        ) : null}

        {desk?.progress.nextDrill ? (
          <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
            <p className="font-mono text-sm text-text-sub-600">Today’s work</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">
              {DRILL_KIND_LABEL[desk.progress.nextDrill.kind]}
            </h2>
            <p className="mt-2 max-w-[62ch] text-base leading-7">{desk.progress.nextDrill.stem}</p>
            <Button.Root asChild className="mt-4 w-fit">
              <Link href={`/drills/${desk.progress.nextDrill.id}`}>Open the drill</Link>
            </Button.Root>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button.Root asChild className="w-fit">
            <Link href="/games">Open the scoresheet</Link>
          </Button.Root>
          <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
            <Link href="/profile">Profile</Link>
          </Button.Root>
          <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
            <Link href="/roadmap">Roadmap</Link>
          </Button.Root>
        </div>
      </DashboardWell>
    </AppShell>
  );
}

function plate00(
  user: Parameters<typeof AppShell>[0]['user'],
  waiting: number,
  desk: TrainingDesk | null,
) {
  const pass = user.enginePass;

  if (isEnginePassActive(pass.status)) {
    const total = passGameTotal(pass);
    return {
      title: 'The engine is reading your games.',
      body:
        total > 0 ? (
          <p>
            Reading every move of the last {total} games. This page stays honest until that pass
            finishes.
          </p>
        ) : (
          <p>
            Every imported move is going through the engine. This page stays honest until that pass
            finishes.
          </p>
        ),
    };
  }

  if (pass.status === 'ready') {
    if (desk?.writeup.status === 'queued' || desk?.writeup.status === 'running') {
      return {
        title: 'Writing who you are.',
        body: <p>The coach is reading the snapshot. Today’s work lands when the writeup is ready.</p>,
      };
    }
    if (desk?.writeup.document) {
      return {
        title: desk.writeup.document.headline,
        body: (
          <p>
            {desk.progress.nextDrill
              ? 'One drill on the desk. The syllabus is the rest of the week.'
              : 'The writeup is ready. Open the syllabus when you want the next leak.'}
          </p>
        ),
      };
    }
    return {
      title: waiting > 0 ? 'Your games are in.' : 'Snapshot is ready.',
      body: (
        <p>
          The raw snapshot is on your{' '}
          <Link
            href="/profile"
            className="font-display font-bold underline decoration-2 underline-offset-4"
          >
            profile
          </Link>
          . The writeup is not written yet.
        </p>
      ),
    };
  }

  if (pass.status === 'failed') {
    return {
      title: 'The engine pass failed.',
      body: <p>{pass.error ?? 'The snapshot did not finish. Open profile for the last counts.'}</p>,
    };
  }

  if (waiting > 0) {
    return {
      title: 'Your games are in.',
      body: (
        <p>
          We have not written who you are yet — that takes a full engine pass, not a glance at the
          scoresheet.
        </p>
      ),
    };
  }

  return {
    title: 'Nothing to coach yet.',
    body: (
      <p>
        Play a rated blitz, rapid, or bullet game on the account you linked. New ones land here
        about every 30 minutes.
      </p>
    ),
  };
}
