'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { GameSource, PublicGameDetail } from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { GameEditor } from '@/components/chess/game-editor';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
import { PlannedList } from '@/components/dashboard/planned-list';
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
      <DashboardWell>
        {game === undefined ? (
          <p className="text-text-sub-600">Loading the scoresheet…</p>
        ) : null}

        {game === null ? (
          <EmptyPlate
            folio="Game lesson"
            title="That game is not on this desk."
            action={
              <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
                <Link href="/games">Back to games</Link>
              </Button.Root>
            }
          >
            It is missing, or it belongs to another player.
          </EmptyPlate>
        ) : null}

        {game ? (
          <>
            <PageIntro
              folio={`${game.timeControl} · you as ${game.userColor}`}
              title={`${game.whiteName} vs ${game.blackName}`}
            >
              {game.result} · {new Date(game.playedAt).toLocaleString()}. The scoresheet is real.
              The lesson is not written yet.
            </PageIntro>
            <GameEditor pgn={game.pgn} orientation={game.userColor} />
            <EmptyPlate folio="Lesson" title="The lesson is not written yet.">
              You can walk the moves. We do not caption a game we have not read — no eval bar, no
              accuracy number, no invented arrows.
            </EmptyPlate>
          </>
        ) : null}

        <PlannedList
          adr="docs/adr/0005-games-and-analysis.md"
          items={[
            {
              title: 'Quiet board',
              detail: 'Real PGN, square, ink frame. Move list is navigation, not the lesson.',
            },
            {
              title: 'Writeup',
              detail: 'Why you played it, what you overlooked, 2–3 engine lines as stories.',
            },
            {
              title: 'Arrows',
              detail: 'Tied to the ply you are on. Deep link ?ply= from profile and drills.',
            },
            {
              title: 'Footer',
              detail: 'This pattern is [named mistake] → profile. Drill this → /drills/[id].',
            },
            {
              title: 'Unlock',
              detail: 'If there is no plan: one game writeup is $1.22 → /billing?intent=game.',
            },
          ]}
        />
      </DashboardWell>
    </AppShell>
  );
}
