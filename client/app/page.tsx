'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import * as Button from '@/components/ui/button';
import * as Input from '@/components/ui/input';
import * as Label from '@/components/ui/label';
import { showError } from '@/components/ui/toast';
import { previewErrorMessage, startPublicReview } from '@/lib/preview';

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="peakelo-scan w-full" aria-hidden />
      <div className="flex flex-col gap-4 border-2 border-ink bg-paper p-5 shadow-regular-sm">
        <p className="flex items-center gap-2 font-mono text-sm text-text-sub-600">
          <span className="size-2 bg-magenta" aria-hidden />
          Peakelo
        </p>
        <h1 className="font-display text-5xl font-extrabold tracking-tight text-text-strong-950">
          Master chess.
        </h1>
        <span className="h-1 w-16 bg-cyan" aria-hidden />
        <p className="max-w-xl text-lg text-text-sub-600">
          Paste a finished Chess.com or Lichess game. I&apos;ll read it the way a coach would — the
          same pass you get after you join.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 border-2 border-t-4 border-ink border-t-magenta bg-bg-white-0 p-5 shadow-regular-sm"
        onSubmit={(event) => {
          event.preventDefault();
          const next = url.trim();
          if (!next || busy) return;
          setBusy(true);
          void startPublicReview(next)
            .then((review) => {
              router.push(`/review/${review.id}`);
            })
            .catch((error: unknown) => {
              showError(previewErrorMessage(error));
            })
            .finally(() => setBusy(false));
        }}
      >
        <Label.Root htmlFor="game-url">Game link</Label.Root>
        <Input.Root>
          <Input.Wrapper>
            <Input.Input
              id="game-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://lichess.org/… or https://www.chess.com/game/live/…"
              autoComplete="off"
              disabled={busy}
            />
          </Input.Wrapper>
        </Input.Root>
        <Button.Root type="submit" className="w-fit" disabled={busy || url.trim().length < 12}>
          {busy ? 'Fetching the game…' : 'Review this game'}
        </Button.Root>
      </form>

      <p className="max-w-xl border-2 border-ink bg-paper px-4 py-3 text-sm leading-6 text-text-sub-600 shadow-regular-xs">
        One game, no account. Join if you want the last hundred kept in sync.
      </p>
      <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
        <Link href="/join">Join Peakelo</Link>
      </Button.Root>
    </main>
  );
}
