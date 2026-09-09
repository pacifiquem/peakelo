'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gameSourcesFromAccounts, type GameSource, type PublicUser } from '@peakelo/shared';

import { ChesscomLogo, LichessLogo } from '@/components/brand/provider-logos';
import * as Button from '@/components/ui/button';
import { addSourceHref, api } from '@/lib/api';

export function AppChrome({
  user,
  children,
  viewingSource,
  onViewingSource,
}: {
  user: PublicUser;
  children: ReactNode;
  viewingSource?: GameSource;
  onViewingSource?: (source: GameSource) => void;
}) {
  const router = useRouter();
  const sources = user.gameSources ?? gameSourcesFromAccounts(user.accounts);

  async function signOut() {
    await api('/auth/logout', { method: 'POST' });
    router.replace('/join');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-ink bg-bg-white-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3">
          <Link
            href={user.onboarding.completed ? '/games' : '/onboarding'}
            className="font-display text-lg font-extrabold"
          >
            Peakelo
          </Link>
          <div className="flex items-center gap-3">
            {viewingSource && onViewingSource ? (
              <div className="flex items-center gap-1" role="group" aria-label="Game source">
                {(['lichess', 'chesscom'] as const).map((source) => {
                  const linked = sources.includes(source);
                  const active = viewingSource === source;
                  const label = source === 'lichess' ? 'Lichess' : 'Chess.com';
                  const Logo = source === 'lichess' ? LichessLogo : ChesscomLogo;
                  if (!linked) {
                    return (
                      <Button.Root
                        key={source}
                        asChild
                        variant="neutral"
                        mode="ghost"
                        size="xsmall"
                      >
                        <Link href={addSourceHref(source)} aria-label={`Import ${label} games`}>
                          <Logo className="size-4 opacity-40" />
                        </Link>
                      </Button.Root>
                    );
                  }
                  return (
                    <Button.Root
                      key={source}
                      type="button"
                      variant={active ? 'primary' : 'neutral'}
                      mode={active ? 'filled' : 'stroke'}
                      size="xsmall"
                      aria-pressed={active}
                      aria-label={`View ${label} games`}
                      onClick={() => onViewingSource(source)}
                    >
                      <Logo className="size-4" />
                    </Button.Root>
                  );
                })}
              </div>
            ) : null}
            <span className="font-mono text-sm text-text-sub-600">{user.displayName}</span>
            <Button.Root
              type="button"
              variant="neutral"
              mode="stroke"
              size="xsmall"
              onClick={() => void signOut()}
            >
              Sign out
            </Button.Root>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
