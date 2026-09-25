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
        <PageIntro folio="Home" title="What to do today.">
          One thing to do next. I won&apos;t invent a plan until I&apos;ve actually read your games.
        </PageIntro>

        <EmptyPlate folio="Today" title={plate.title}>
          {plate.body}
        </EmptyPlate>

        {waiting.length > 0 ? (
          <section className="border-2 border-t-4 border-ink border-t-cyan bg-bg-white-0 shadow-regular-xs">
            <header className="border-b-2 border-ink bg-bg-weak-50 px-4 py-2">
              <p className="font-mono text-sm font-medium text-text-strong-950">
                {desk?.writeup.document ? 'Games to open' : 'Waiting on your writeup'}
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
                      you played {game.userColor} · {game.result} · {game.timeControl}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {desk?.writeup.document ? (
          <section className="border-2 border-t-4 border-ink border-t-cyan bg-bg-white-0 p-5 shadow-regular-xs">
            <p className="font-mono text-sm text-text-sub-600">Who you are</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">{desk.writeup.document.headline}</h2>
            <p className="mt-2 font-mono text-sm">
              Working toward {desk.progress.goalLabel}. {desk.progress.stepsDone} of{' '}
              {desk.progress.stepsTotal} steps. {desk.progress.drillsDone} of{' '}
              {desk.progress.drillsTotal} positions cleared. {desk.progress.drillsDue} still to play.
            </p>
          </section>
        ) : null}

        {desk?.progress.nextDrill ? (
          <section className="border-2 border-t-4 border-ink border-t-magenta bg-bg-white-0 p-5 shadow-regular-sm">
            <p className="font-mono text-sm text-text-sub-600">Today’s work</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">
              {DRILL_KIND_LABEL[desk.progress.nextDrill.kind]}
            </h2>
            <p className="mt-2 max-w-[62ch] text-base leading-7">{desk.progress.nextDrill.stem}</p>
            <Button.Root asChild className="mt-4 w-fit">
              <Link href={`/drills/${desk.progress.nextDrill.id}`}>Play this one</Link>
            </Button.Root>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button.Root asChild className="w-fit">
            <Link href="/games">See your games</Link>
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
      title: 'I’m reading your games.',
      body:
        total > 0 ? (
          <p>
            I’m going through every move of the last {total} games. Today’s work shows up here when
            that’s done.
          </p>
        ) : (
          <p>
            I’m going through every imported move. Today’s work shows up here when that’s done.
          </p>
        ),
    };
  }

  if (pass.status === 'ready') {
    if (desk?.writeup.status === 'queued' || desk?.writeup.status === 'running') {
      return {
        title: 'Writing you up.',
        body: <p>I’m reading what the engine found. Today’s work lands when the writeup is ready.</p>,
      };
    }
    if (desk?.writeup.document) {
      return {
        title: desk.writeup.document.headline,
        body: (
          <p>
            {desk.progress.nextDrill
              ? 'One position is waiting. The roadmap is the rest of the week.'
              : 'The writeup is ready. Open the roadmap when you want the next leak.'}
          </p>
        ),
      };
    }
    return {
      title: waiting > 0 ? 'Your games are in.' : 'I’ve read the games.',
      body: (
        <p>
          The engine has been through your games.{' '}
          <Link
            href="/profile"
            className="font-display font-bold text-magenta underline decoration-2 underline-offset-4"
          >
            Write my profile
          </Link>
          .
        </p>
      ),
    };
  }

  if (pass.status === 'failed') {
    return {
      title: 'I couldn’t finish reading your games.',
      body: <p>{pass.error ?? 'The read stopped early. Open your profile for where it got to.'}</p>,
    };
  }

  if (waiting > 0) {
    return {
      title: 'Your games are in.',
      body: (
        <p>
          I haven’t written you up yet. That takes a full read of the games, not a glance at the
          scoresheet.
        </p>
      ),
    };
  }

  return {
    title: 'Nothing on the desk yet.',
    body: (
      <p>
        Play a rated blitz, rapid, or bullet game on the account you linked. I’ll pick it up within
        about half an hour.
      </p>
    ),
  };
}
