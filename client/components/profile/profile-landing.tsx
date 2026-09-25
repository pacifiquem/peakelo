import Link from 'next/link';
import type { Writeup } from '@peakelo/shared';

import { CitationChips } from '@/components/profile/citation-chips';
import { drillKindHref } from '@/lib/drill-kind';
import { bottleneckLead, PROFILE_CHAPTERS, writeupBottlenecks } from '@/lib/profile-chapters';

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
              <li key={item.key} className="border-2 border-l-4 border-ink border-l-cyan bg-bg-white-0 p-5 shadow-regular-xs">
                <p className="font-mono text-sm">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-1 font-display text-xl font-extrabold">{item.name}</h3>
                <p className="mt-2 max-w-[62ch] text-base leading-7">{bottleneckLead(item.story)}</p>
                <CitationChips citations={item.citations} />
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={item.href}
                    className="font-display text-sm font-bold underline decoration-2 underline-offset-4"
                  >
                    Read it
                  </Link>
                  {item.kind ? (
                    <Link
                      href={drillKindHref(item.kind)}
                      className="font-display text-sm font-bold text-magenta underline decoration-2 underline-offset-4"
                    >
                      Practice it
                    </Link>
                  ) : null}
                </div>
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
                className="block border-2 border-l-4 border-ink border-l-magenta bg-bg-white-0 p-4 shadow-regular-xs hover:bg-bg-weak-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <h3 className="font-display text-lg font-extrabold">{chapter.label}</h3>
                <p className="mt-1 max-w-[62ch] text-sm leading-6 text-text-sub-600">
                  {chapter.tease(document)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
