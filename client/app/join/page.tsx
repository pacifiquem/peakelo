'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { ChesscomWordmark, GoogleLogo, LichessLogo } from '@/components/brand/provider-logos';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { oauthStartUrl } from '@/lib/api';
import { useMe } from '@/lib/session';

const ERRORS: Record<string, string> = {
  oauth_denied: 'That sign-in was cancelled.',
  oauth_failed: 'Sign-in failed. Try again.',
  oauth_start: 'This sign-in method is not available right now.',
  unknown_provider: 'Unknown login method.',
};

function JoinInner() {
  const params = useSearchParams();
  const { user } = useMe();
  const error = params.get('error');

  useEffect(() => {
    if (user === undefined) return;
    if (user && error) {
      window.location.replace(`/onboarding?error=${encodeURIComponent(error)}`);
      return;
    }
    if (user) {
      window.location.replace(user.onboarding.completed ? '/home' : '/onboarding');
      return;
    }
    if (error) {
      showError(ERRORS[error] ?? 'Sign-in failed.');
    }
  }, [user, error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <div className="peakelo-scan w-full" aria-hidden />
      <div className="flex flex-col gap-4 border-2 border-t-4 border-ink border-t-gold bg-paper p-5 shadow-regular-sm">
      <p className="flex items-center gap-2 font-mono text-sm text-text-sub-600">
        <span className="size-2 bg-magenta" aria-hidden />
        Peakelo
      </p>
      <h1 className="font-display text-5xl font-extrabold tracking-tight">Join Peakelo</h1>
      <span className="h-1 w-16 bg-gold" aria-hidden />
      <p className="max-w-md text-lg text-text-sub-600">
        Use the account you already play with.
      </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button.Root asChild variant="neutral" mode="stroke" className="w-full justify-center">
          <a href={oauthStartUrl('google')}>
            <GoogleLogo className="size-5" />
            Continue with Google
          </a>
        </Button.Root>

        <Button.Root asChild variant="neutral" mode="stroke" className="w-full justify-center">
          <a href={oauthStartUrl('lichess')}>
            <LichessLogo className="size-5" />
            Continue with Lichess
          </a>
        </Button.Root>

        <Button.Root asChild variant="neutral" mode="stroke" className="w-full justify-center">
          <a href={oauthStartUrl('chesscom')}>
            Continue with
            <ChesscomWordmark className="h-6 w-auto" />
          </a>
        </Button.Root>
      </div>

      <Link
        href="/"
        className="w-fit cursor-pointer text-sm text-text-sub-600 underline decoration-2 underline-offset-2"
      >
        Back
      </Link>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<main className="px-6 py-16">Loading…</main>}>
      <JoinInner />
    </Suspense>
  );
}
