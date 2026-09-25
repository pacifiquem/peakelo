'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { GameSource, PublicGameDetail } from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { GameEditor } from '@/components/chess/game-editor';
import { Breadcrumb } from '@/components/dashboard/breadcrumb';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { api } from '@/lib/api';

export default function GameLessonPage() {
  return (
    <DashboardGate>
      {(user) => (
        <Suspense fallback={<main className="px-6 py-16">Loading the scoresheet…</main>}>
          <GameLesson user={user} />
        </Suspense>
      )}
    </DashboardGate>
  );
}

function GameLesson({ user }: { user: Parameters<typeof AppShell>[0]['user'] }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<PublicGameDetail | null | undefined>(undefined);

  useEffect(() => {
    void api<PublicGameDetail>(`/games/${params.id}`)
      .then(setGame)
      .catch((err: unknown) => {
        showError(err instanceof Error ? err.message : 'Could not load that game');
        setGame(null);
      });
  }, [params.id]);

  return (
    <AppShell
      user={user}
      viewingSource={game?.source}
      onViewingSource={(source: GameSource) => {
        router.replace(`/games?source=${source}`);
      }}
    >
      <DashboardWell size="study">
        {game === undefined ? (
          <p className="text-text-sub-600">Loading the scoresheet…</p>
        ) : null}

        {game === null ? (
          <EmptyPlate
            folio="Game lesson"
            title="I can’t find that game."
            action={
              <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
                <Link href="/games">Back to games</Link>
              </Button.Root>
            }
          >
            It’s missing, or it belongs to someone else.
          </EmptyPlate>
        ) : null}

        {game ? (
          <>
            <Breadcrumb
              items={[
                { label: 'Games', href: '/games' },
                { label: `${game.whiteName} vs ${game.blackName}` },
              ]}
            />
            <header className="flex flex-col gap-1">
              <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                {game.whiteName} vs {game.blackName}
              </h1>
              <p className="font-mono text-sm text-text-strong-950">
                {game.timeControl} · you played {game.userColor} · {game.result} ·{' '}
                <time dateTime={game.playedAt}>{new Date(game.playedAt).toLocaleString()}</time>
                {game.analysis.status === 'ready'
                  ? ' · the moves are marked'
                  : ' · the marks show up after the read'}
              </p>
            </header>
            <GameEditor
              gameId={game.id}
              pgn={game.pgn}
              orientation={game.userColor}
              analysis={game.analysis}
            />
          </>
        ) : null}
      </DashboardWell>
    </AppShell>
  );
}
