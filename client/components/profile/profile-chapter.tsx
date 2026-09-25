import Link from 'next/link';
import type { Writeup } from '@peakelo/shared';

import { ChapterFooter } from '@/components/profile/chapter-footer';
import { CitationChips } from '@/components/profile/citation-chips';
import { PatternCard } from '@/components/profile/pattern-card';
import { drillKindHref, stepIdToKind } from '@/lib/drill-kind';
import type { ProfileChapterId } from '@/lib/profile-chapters';

export function ProfileChapter({
  document,
  chapterId,
}: {
  document: Writeup;
  chapterId: ProfileChapterId;
}) {
  return (
    <article className="flex flex-col gap-8">
      <ChapterBody document={document} chapterId={chapterId} />
      <ChapterFooter chapterId={chapterId} />
    </article>
  );
}

function ChapterBody({ document, chapterId }: { document: Writeup; chapterId: ProfileChapterId }) {
  if (chapterId === 'deciders') {
    return (
      <section className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-extrabold">How games are decided</h1>
        <p className="font-mono text-sm">{document.deciders.record}</p>
        <p className="max-w-[62ch] text-base leading-7">{document.deciders.story}</p>
      </section>
    );
  }

  if (chapterId === 'clock') {
    return (
      <section className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-extrabold">Clock</h1>
        <p className="max-w-[62ch] text-base leading-7">{document.clock.story}</p>
      </section>
    );
  }

  if (chapterId === 'mistakes') {
    return (
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-extrabold">Recurring mistakes</h1>
          <p className="max-w-[62ch] text-sm leading-6 text-text-sub-600">
            The mistakes that keep showing up, with the games they came from.
          </p>
        </header>
        {document.mistakes.length === 0 ? (
          <p className="text-sm text-text-sub-600">I didn’t name a repeating mistake in this writeup.</p>
        ) : (
          document.mistakes.map((block) => (
            <PatternCard key={block.name} name={block.name} story={block.story} citations={block.citations} />
          ))
        )}
      </section>
    );
  }

  if (chapterId === 'structures') {
    return (
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-extrabold">Structures and lines</h1>
          <p className="max-w-[62ch] text-sm leading-6 text-text-sub-600">
            Only the setups where your games actually leak.
          </p>
        </header>
        {document.structures.length === 0 ? (
          <p className="text-sm text-text-sub-600">No structure stood out as a leak.</p>
        ) : (
          document.structures.map((block) => (
            <PatternCard key={block.name} name={block.name} story={block.story} citations={block.citations} />
          ))
        )}
      </section>
    );
  }

  if (chapterId === 'tactics') {
    return (
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-extrabold">Tactics you miss</h1>
          <p className="max-w-[62ch] text-sm leading-6 text-text-sub-600">
            The tactics you miss, named from your own games.
          </p>
        </header>
        {document.tactics.length === 0 ? (
          <p className="text-sm text-text-sub-600">No tactic stood out as a miss.</p>
        ) : (
          document.tactics.map((block) => (
            <PatternCard key={block.name} name={block.name} story={block.story} citations={block.citations} />
          ))
        )}
      </section>
    );
  }

  if (chapterId === 'keep') {
    return (
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-extrabold">Keep these</h1>
          <p className="max-w-[62ch] text-sm leading-6 text-text-sub-600">
            Strengths to keep. The roadmap should not try to “fix” these.
          </p>
        </header>
        {document.keep.length === 0 ? (
          <p className="text-sm text-text-sub-600">I didn’t call out a strength to protect.</p>
        ) : (
          document.keep.map((block) => (
            <PatternCard key={block.name} name={block.name} story={block.story} citations={block.citations} />
          ))
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-extrabold">What to do</h1>
      <ol className="flex flex-col gap-4">
        {document.now.map((item, index) => {
          const kind = stepIdToKind(item.stepId);
          return (
            <li key={item.stepId} className="border-2 border-t-4 border-ink border-t-gold bg-bg-white-0 p-5 shadow-regular-xs">
              <p className="font-mono text-sm">{String(index + 1).padStart(2, '0')}</p>
              <h2 className="mt-1 font-display text-xl font-extrabold">{item.title}</h2>
              <p className="mt-2 max-w-[62ch] text-base leading-7">{item.why}</p>
              <CitationChips citations={item.citations} />
              <div className="mt-4 flex flex-wrap gap-3">
                {kind ? (
                  <Link
                    href={drillKindHref(kind)}
                    className="font-display text-sm font-bold underline decoration-2 underline-offset-4"
                  >
                    Practice it
                  </Link>
                ) : null}
                <Link
                  href="/roadmap"
                  className="font-display text-sm font-bold text-magenta underline decoration-2 underline-offset-4"
                >
                  See it on the roadmap
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
