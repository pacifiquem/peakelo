'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClientError } from '@peakelo/shared';

import { AppChrome } from '@/components/app-chrome';
import { ChesscomLogo, ChesscomWordmark } from '@/components/brand/provider-logos';
import { ImportTicker } from '@/components/import-ticker';
import * as Button from '@/components/ui/button';
import * as Input from '@/components/ui/input';
import * as Label from '@/components/ui/label';
import { showError } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { useMe } from '@/lib/session';

export default function ConnectChesscomPage() {
  const router = useRouter();
  const { user, error, refresh } = useMe();
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const importing = user?.onboarding.importStatus === 'running';

  useEffect(() => {
    if (user === null) router.replace('/join');
  }, [user, router]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  useEffect(() => {
    if (!user?.gameSources.includes('chesscom')) return;
    if (user.onboarding.importStatus !== 'completed') return;
    router.replace(user.onboarding.completed ? '/games?source=chesscom' : '/onboarding');
  }, [user, router]);

  useEffect(() => {
    if (user?.onboarding.importStatus !== 'running') return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 1500);
    return () => window.clearInterval(timer);
  }, [user?.onboarding.importStatus, refresh]);

  useEffect(() => {
    if (user?.onboarding.importStatus === 'failed' && user.onboarding.importError) {
      showError(user.onboarding.importError);
    }
  }, [user?.onboarding.importStatus, user?.onboarding.importError]);

  if (user === undefined || user === null) {
    return <main className="px-6 py-16 text-text-sub-600">Loading…</main>;
  }

  async function submit() {
    if (!user) return;
    setBusy(true);
    try {
      await api('/onboarding/chesscom', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      if (!user.onboarding.completed) {
        router.replace('/onboarding');
        return;
      }
      const timeControls =
        user.onboarding.timeControls.length > 0
          ? user.onboarding.timeControls
          : ['rapid', 'blitz', 'bullet'];
      await api('/onboarding/import', {
        method: 'POST',
        body: JSON.stringify({ timeControls, sources: ['chesscom'] }),
      });
      await refresh();
    } catch (err) {
      showError(err instanceof ApiClientError ? err.message : 'Could not link that username.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppChrome user={user}>
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-12">
        <ChesscomWordmark className="h-10 w-auto" />
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Import your games</h1>
        <p className="text-lg text-text-sub-600">
          Use your Chess.com username. It does not have to match Lichess.
        </p>
        <Label.Root htmlFor="chesscom-username">Chess.com username</Label.Root>
        <Input.Root>
          <Input.Wrapper>
            <Input.Input
              id="chesscom-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="your_chesscom_name"
              autoComplete="username"
              disabled={busy || importing}
            />
          </Input.Wrapper>
        </Input.Root>
        <ImportTicker active={busy || importing} />
        <Button.Root
          type="button"
          className="w-fit"
          disabled={busy || importing || username.trim().length < 3}
          onClick={() => void submit()}
        >
          <ChesscomLogo className="size-5" />
          Import games
        </Button.Root>
      </main>
    </AppChrome>
  );
}
