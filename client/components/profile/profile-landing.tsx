import Link from 'next/link';
import type { Writeup } from '@peakelo/shared';

import { PROFILE_CHAPTERS, writeupBottlenecks } from '@/lib/profile-chapters';

export function ProfileLanding({ document }: { document: Writeup }) {
  const bottlenecks = writeupBottlenecks(document);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-sm text-text-strong-950">
          {document.level.bandLabel}
          {document.level.rating != null
            ? ` · ${document.level.source === 'chesscom' ? 'Chess.com' : 'Lichess'} ${document.level.timeControl} ${document.level.rating}`
            : ''}
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          {document.headline}
        </h1>
        <span className="h-1 w-16 bg-cyan" aria-hidden />
        <p className="max-w-[62ch] text-lg leading-7 text-text-strong-950">{document.playerKindWhy}</p>
      </header>

      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-extrabold">What keeps costing you</h2>
          <p className="max-w-[62ch] text-sm leading-6 text-text-sub-600">
            Every leak I could name from your games.
          </p>
        </header>
        {bottlenecks.length === 0 ? (
          <p className="text-sm text-text-sub-600">I didn’t find a named leak in this writeup.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {bottlenecks.map((item, index) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-4 border-2 border-ink bg-bg-white-0 px-4 py-3 shadow-regular-xs hover:bg-bg-weak-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="flex items-center gap-3">
                    <span className="size-2.5 shrink-0 bg-cyan" aria-hidden />
                    <span className="font-display text-lg font-extrabold">{item.name}</span>
                  </span>
                  <span className="font-mono text-sm text-text-sub-600">{String(index + 1).padStart(2, '0')}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-extrabold">The rest of the writeup</h2>
        <ul className="flex flex-col gap-3">
          {PROFILE_CHAPTERS.map((chapter) => (
            <li key={chapter.id}>
              <Link
                href={chapter.href}
                className="flex items-center gap-3 border-2 border-ink bg-bg-white-0 px-4 py-3 shadow-regular-xs hover:bg-bg-weak-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <span className="size-2.5 shrink-0 bg-magenta" aria-hidden />
                <h3 className="font-display text-lg font-extrabold">{chapter.label}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
