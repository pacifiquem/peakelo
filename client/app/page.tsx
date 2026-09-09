import Link from 'next/link';

import * as Button from '@/components/ui/button';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6 py-16">
      <p className="font-mono text-sm tracking-wide text-text-sub-600">PEAKELO // SETUP</p>
      <h1 className="font-display text-5xl font-extrabold tracking-tight text-text-strong-950">
        Master chess.
      </h1>
      <p className="max-w-xl text-lg text-text-sub-600">
        Import your Chess.com or Lichess games, tell us what you want to get better at, and we keep
        the rest of your games in sync.
      </p>
      <Button.Root asChild className="w-fit">
        <Link href="/join">Join</Link>
      </Button.Root>
    </main>
  );
}
