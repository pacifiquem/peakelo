'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  gameSourcesFromAccounts,
  type GameSource,
  type PaginatedResult,
  type PublicGame,
} from '@peakelo/shared';

import { AppChrome } from '@/components/app-chrome';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { useMe } from '@/lib/session';

function GamesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, error } = useMe();
  const [games, setGames] = useState<PaginatedResult<PublicGame> | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user === null) router.replace('/join');
    if (user && !user.onboarding.completed) router.replace('/onboarding');
  }, [user, router]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  const linked = user ? (user.gameSources ?? gameSourcesFromAccounts(user.accounts)) : [];
  const requested = params.get('source');
  const viewingSource: GameSource | undefined =
    requested === 'lichess' || requested === 'chesscom' ? requested : linked[0];

  useEffect(() => {
    if (!user?.onboarding.completed || !viewingSource) return;
    void api<PaginatedResult<PublicGame>>(`/games?page=${page}&source=${viewingSource}`)
      .then(setGames)
      .catch((err: unknown) => {
        showError(err instanceof Error ? err.message : 'Could not load games');
      });
  }, [user, page, viewingSource]);

  if (user === undefined) {
    return <main className="px-6 py-16 text-text-sub-600">Loading your games…</main>;
  }
  if (!user || !user.onboarding.completed) return null;

  function viewSource(source: GameSource) {
    setPage(1);
    setGames(null);
    router.replace(`/games?source=${source}`);
  }

  return (
    <AppChrome user={user} viewingSource={viewingSource} onViewingSource={viewSource}>
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12">
        <div>
          <p className="font-mono text-sm text-text-sub-600">YOUR GAMES</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Imported and syncing.
          </h1>
          <p className="mt-2 max-w-xl text-lg text-text-sub-600">
            {viewingSource === 'chesscom' ? 'Chess.com' : 'Lichess'} games. New ones land about
            every 30 minutes.
          </p>
        </div>

        {games && games.data.length === 0 ? (
          <p className="text-sm text-text-sub-600">
            No games matched those time controls yet. Play one and wait for the next sync.
          </p>
        ) : null}

        <ul className="flex flex-col gap-3">
          {games?.data.map((game) => (
            <li
              key={game.id}
              className="grid gap-2 border-2 border-ink bg-bg-white-0 px-4 py-3 shadow-regular-xs md:grid-cols-[auto_1fr_auto] md:items-center"
            >
              <span className="font-mono text-xs text-text-sub-600">{game.timeControl}</span>
              <p className="font-display font-bold">
                {game.whiteName} vs {game.blackName}
                <span className="ml-2 font-sans text-sm font-normal text-text-sub-600">
                  you as {game.userColor} · {game.result}
                </span>
              </p>
              <time className="font-mono text-xs text-text-sub-600" dateTime={game.playedAt}>
                {new Date(game.playedAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>

        {games && games.pagination.totalPages > 1 ? (
          <div className="flex items-center gap-3">
            <Button.Root
              type="button"
              variant="neutral"
              mode="stroke"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button.Root>
            <span className="font-mono text-sm">
              {games.pagination.page} / {games.pagination.totalPages}
            </span>
            <Button.Root
              type="button"
              variant="neutral"
              mode="stroke"
              disabled={page >= games.pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button.Root>
          </div>
        ) : null}
      </main>
    </AppChrome>
  );
}

export default function GamesPage() {
  return (
    <Suspense fallback={<main className="px-6 py-16">Loading your games…</main>}>
      <GamesInner />
    </Suspense>
  );
}
