'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { gameSourcesFromAccounts, type PaginatedResult, type PublicGame } from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
import { PlannedList } from '@/components/dashboard/planned-list';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { isEnginePassActive, passGameTotal } from '@/lib/engine-pass';

export default function HomePage() {
  return (
    <DashboardGate>
      {(user) => <HomeDesk user={user} />}
    </DashboardGate>
  );
}

function HomeDesk({ user }: { user: Parameters<typeof AppShell>[0]['user'] }) {
  const [games, setGames] = useState<PaginatedResult<PublicGame> | null>(null);
  const source = (user.gameSources ?? gameSourcesFromAccounts(user.accounts))[0];

  useEffect(() => {
    if (!source) return;
    void api<PaginatedResult<PublicGame>>(`/games?page=1&pageSize=3&source=${source}`)
      .then(setGames)
      .catch((err: unknown) => {
        showError(err instanceof Error ? err.message : 'Could not load games');
      });
  }, [source]);

  const waiting = games?.data ?? [];
  const plate = plate00(user, waiting.length);

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
                Waiting on a writeup
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

        <div className="flex flex-wrap gap-3">
          <Button.Root asChild className="w-fit">
            <Link href="/games">Open the scoresheet</Link>
          </Button.Root>
          <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
            <Link href="/profile">Profile</Link>
          </Button.Root>
        </div>

        <PlannedList
          adr="docs/adr/0003-home.md"
          items={[
            {
              title: 'Player headline',
              detail: 'One sentence from the profile writeup, only after the engine pass.',
            },
            {
              title: 'Today’s work',
              detail: 'A single CTA: continue a named drill, review a named game, or open a roadmap step.',
            },
            {
              title: 'Waiting on you',
              detail: 'At most three unreviewed games or unread writeups.',
            },
            {
              title: 'Sync line',
              detail: 'New games land about every 30 minutes — already true, stays a sentence.',
            },
          ]}
        />
      </DashboardWell>
    </AppShell>
  );
}

function plate00(user: Parameters<typeof AppShell>[0]['user'], waiting: number) {
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
