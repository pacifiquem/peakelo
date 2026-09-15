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
      <div className="flex flex-col gap-4">
        <p className="font-mono text-sm tracking-wide text-text-sub-600">PEAKELO</p>
        <h1 className="font-display text-5xl font-extrabold tracking-tight text-text-strong-950">
          Master chess.
        </h1>
        <p className="max-w-xl text-lg text-text-sub-600">
          Paste a finished Chess.com or Lichess game. We run the engine and write a human review —
          the same pass the desk uses after you join.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs"
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

      <p className="max-w-xl text-sm leading-6 text-text-sub-600">
        One public game, no account. Join to import your last hundred and keep them in sync.
      </p>
      <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
        <Link href="/join">Join Peakelo</Link>
      </Button.Root>
    </main>
  );
}
