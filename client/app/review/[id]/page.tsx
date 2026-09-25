'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { PublicReview } from '@peakelo/shared';

import { PublicReviewDesk } from '@/components/preview/public-review-desk';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { fetchPublicReview, previewErrorMessage } from '@/lib/preview';

export default function PublicReviewPage() {
  const params = useParams<{ id: string }>();
  const [review, setReview] = useState<PublicReview | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicReview(params.id)
      .then((data) => {
        if (!cancelled) setReview(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        showError(previewErrorMessage(error));
        setReview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!review || (review.status !== 'queued' && review.status !== 'running')) return;
    const timer = window.setInterval(() => {
      void fetchPublicReview(params.id)
        .then(setReview)
        .catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [params.id, review]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="peakelo-scan w-full" aria-hidden />
      <header className="flex flex-col gap-3 border-2 border-ink bg-paper p-5 shadow-regular-xs">
        <Link href="/" className="inline-flex w-fit items-center gap-2 font-display text-sm font-bold">
          <span className="size-2 bg-magenta" aria-hidden />
          Peakelo
        </Link>
        {review ? (
          <>
            <p className="font-mono text-sm">
              {review.source === 'chesscom' ? 'Chess.com' : 'Lichess'}
              {review.timeControl ? ` · ${review.timeControl}` : ''}
              {review.playedAt ? ` · ${new Date(review.playedAt).toLocaleString()}` : ''}
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">
              {review.whiteName} vs {review.blackName}
            </h1>
            <p className="text-lg text-text-sub-600">
              {review.result}
              {review.whiteRating != null || review.blackRating != null
                ? ` · ${review.whiteRating ?? '—'} / ${review.blackRating ?? '—'}`
                : ''}
            </p>
          </>
        ) : null}
      </header>

      {review === undefined ? <p className="text-text-sub-600">Loading the game…</p> : null}

      {review === null ? (
        <p className="text-text-sub-600">I can&apos;t find that review.</p>
      ) : null}

      {review && (review.status === 'queued' || review.status === 'running') ? (
        <p className="max-w-[62ch] text-base leading-7">
          {review.status === 'queued'
            ? 'The game is here. I’ll read every move next.'
            : 'I’m reading every move. The writeup comes after that.'}
        </p>
      ) : null}

      {review && review.status === 'failed' ? (
        <p className="max-w-[62ch] text-base leading-7">
          {review.error ?? 'I couldn’t finish that game.'}
        </p>
      ) : null}

      {review && review.status === 'ready' ? <PublicReviewDesk review={review} /> : null}

      {review && review.pgn && review.status !== 'ready' && review.status !== 'failed' ? (
        <PublicReviewDesk review={review} />
      ) : null}

      <div className="flex flex-wrap gap-3 border-t-2 border-ink pt-6">
        <Button.Root asChild className="w-fit">
          <Link href="/join">Join for your last hundred games</Link>
        </Button.Root>
        <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
          <Link href="/">Review another game</Link>
        </Button.Root>
      </div>
    </main>
  );
}
