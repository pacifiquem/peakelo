'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  gameSourcesFromAccounts,
  type GameSource,
  type PaginatedResult,
  type PublicGame,
  type TimeControl,
} from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { PageIntro } from '@/components/dashboard/page-intro';

import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

const CLOCKS: { id: TimeControl | 'all'; label: string }[] = [
  { id: 'all', label: 'All clocks' },
  { id: 'rapid', label: 'Rapid' },
  { id: 'blitz', label: 'Blitz' },
  { id: 'bullet', label: 'Bullet' },
];

function GamesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [games, setGames] = useState<PaginatedResult<PublicGame> | null>(null);
  const [page, setPage] = useState(1);

  const requested = params.get('source');
  const clockParam = params.get('clock');
  const clock: TimeControl | 'all' =
    clockParam === 'rapid' || clockParam === 'blitz' || clockParam === 'bullet' ? clockParam : 'all';

  return (
    <DashboardGate>
      {(user) => {
        const linked = user.gameSources ?? gameSourcesFromAccounts(user.accounts);
        const viewingSource: GameSource | undefined =
          requested === 'lichess' || requested === 'chesscom' ? requested : linked[0];

        return (
          <GamesDesk
            user={user}
            viewingSource={viewingSource}
            clock={clock}
            page={page}
            games={games}
            setGames={setGames}
            setPage={setPage}
            onSource={(source) => {
              setPage(1);
              setGames(null);
              const next = new URLSearchParams(params.toString());
              next.set('source', source);
              router.replace(`/games?${next.toString()}`);
            }}
            onClock={(nextClock) => {
              setPage(1);
              setGames(null);
              const next = new URLSearchParams(params.toString());
              if (viewingSource) next.set('source', viewingSource);
              if (nextClock === 'all') next.delete('clock');
              else next.set('clock', nextClock);
              router.replace(`/games?${next.toString()}`);
            }}
          />
        );
      }}
    </DashboardGate>
  );
}

function GamesDesk({
  user,
  viewingSource,
  clock,
  page,
  games,
  setGames,
  setPage,
  onSource,
  onClock,
}: {
  user: Parameters<typeof AppShell>[0]['user'];
  viewingSource?: GameSource;
  clock: TimeControl | 'all';
  page: number;
  games: PaginatedResult<PublicGame> | null;
  setGames: (value: PaginatedResult<PublicGame> | null) => void;
  setPage: (value: number | ((current: number) => number)) => void;
  onSource: (source: GameSource) => void;
  onClock: (clock: TimeControl | 'all') => void;
}) {
  useEffect(() => {
    if (!viewingSource) return;
    const clockQuery = clock === 'all' ? '' : `&timeControl=${clock}`;
    void api<PaginatedResult<PublicGame>>(`/games?page=${page}&source=${viewingSource}${clockQuery}`)
      .then(setGames)
      .catch((err: unknown) => {
        showError(err instanceof Error ? err.message : 'Could not load games');
      });
  }, [viewingSource, page, clock, setGames]);

  return (
    <AppShell user={user} viewingSource={viewingSource} onViewingSource={onSource}>
      <DashboardWell>
        <PageIntro folio="Games" title="Your games.">
          {viewingSource === 'chesscom' ? 'Chess.com' : 'Lichess'} games. New ones show up about
          every half hour. One site at a time.
        </PageIntro>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Time control">
          {CLOCKS.map((item) => (
            <Button.Root
              key={item.id}
              type="button"
              variant={clock === item.id ? 'primary' : 'neutral'}
              mode={clock === item.id ? 'filled' : 'stroke'}
              size="small"
              onClick={() => onClock(item.id)}
            >
              {item.label}
            </Button.Root>
          ))}
        </div>

        {games && games.data.length === 0 ? (
          <p className="text-sm text-text-strong-950">
            No games in those time controls yet. Play one and I’ll pick it up on the next sync.
          </p>
        ) : null}

        {games && games.data.length > 0 ? (
          <div className="overflow-x-auto border-2 border-t-4 border-ink border-t-cyan bg-bg-white-0 shadow-regular-xs">
            <table className="w-full min-w-[44rem] table-fixed text-left">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[34%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[24%]" />
              </colgroup>
              <thead className="border-b-2 border-ink bg-bg-soft-200 font-mono text-sm text-text-strong-950">
                <tr>
                  <th className="px-4 py-2 font-semibold">Clock</th>
                  <th className="px-4 py-2 font-semibold">Game</th>
                  <th className="px-4 py-2 font-semibold">You</th>
                  <th className="px-4 py-2 font-semibold">Result</th>
                  <th className="px-4 py-2 font-semibold">Played</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink">
                {games.data.map((game) => (
                  <tr key={game.id} className="odd:bg-bg-white-0 even:bg-bg-weak-50">
                    <td className="px-4 py-3 font-mono text-sm">{game.timeControl}</td>
                    <td className="truncate px-4 py-3">
                      <Link
                        href={`/games/${game.id}`}
                        className={cn(
                          'font-display font-bold underline-offset-4 hover:underline',
                        )}
                      >
                        {game.whiteName} vs {game.blackName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{game.userColor}</td>
                    <td className="px-4 py-3 font-mono text-sm">{game.result}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      <time dateTime={game.playedAt}>
                        {new Date(game.playedAt).toLocaleString()}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

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
      </DashboardWell>
    </AppShell>
  );
}

export default function GamesPage() {
  return (
    <Suspense fallback={<main className="px-6 py-16">Loading your games…</main>}>
      <GamesInner />
    </Suspense>
  );
}
