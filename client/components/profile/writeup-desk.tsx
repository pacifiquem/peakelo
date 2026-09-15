import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Citation, PublicWriteup, Writeup } from '@peakelo/shared';

import * as Button from '@/components/ui/button';

export function WriteupDesk({
  writeup,
  onGenerate,
  busy,
}: {
  writeup: PublicWriteup;
  onGenerate?: () => void;
  busy?: boolean;
}) {
  if (writeup.status === 'queued' || writeup.status === 'running') {
    return (
      <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
        <p className="font-mono text-sm text-text-sub-600">Writeup</p>
        <h2 className="mt-2 font-display text-xl font-extrabold">Writing who you are.</h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
          The coach is reading the snapshot and the teaching beats. This stays honest until the
          document is ready.
        </p>
      </section>
    );
  }

  if (writeup.status === 'failed') {
    return (
      <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
        <p className="font-mono text-sm text-text-sub-600">Writeup</p>
        <h2 className="mt-2 font-display text-xl font-extrabold">The writeup failed.</h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
          {writeup.error ?? 'The coach could not finish the document.'}
        </p>
        {onGenerate ? (
          <Button.Root type="button" className="mt-4 w-fit" disabled={busy} onClick={onGenerate}>
            Try again
          </Button.Root>
        ) : null}
      </section>
    );
  }

  if (!writeup.document) {
    return (
      <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
        <p className="font-mono text-sm text-text-sub-600">Writeup</p>
        <h2 className="mt-2 font-display text-xl font-extrabold">The writeup is not written yet.</h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
          The snapshot is counts. The coach document is the voice — every claim tied to your games.
        </p>
        {onGenerate ? (
          <Button.Root type="button" className="mt-4 w-fit" disabled={busy} onClick={onGenerate}>
            Write my profile
          </Button.Root>
        ) : null}
      </section>
    );
  }

  return <WriteupDocument document={writeup.document} generatedAt={writeup.generatedAt} />;
}

function WriteupDocument({ document, generatedAt }: { document: Writeup; generatedAt: string | null }) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-sm text-text-strong-950">
          {document.level.bandLabel}
          {document.level.rating != null
            ? ` · ${document.level.source} ${document.level.timeControl} ${document.level.rating}`
            : ''}
          {generatedAt ? (
            <>
              {' · '}
              <time dateTime={generatedAt}>{new Date(generatedAt).toLocaleString()}</time>
            </>
          ) : null}
        </p>
        <h2 id="headline" className="font-display text-3xl font-extrabold tracking-tight">
          {document.headline}
        </h2>
        <p className="max-w-[62ch] text-base leading-7 text-text-strong-950">{document.playerKindWhy}</p>
        <p className="max-w-[62ch] text-sm leading-6 text-text-strong-950">{document.level.trajectory}</p>
      </header>

      <nav aria-label="Writeup sections" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Anchor href="#headline">Headline</Anchor>
        <Anchor href="#deciders">How games are decided</Anchor>
        <Anchor href="#clock">Clock</Anchor>
        <Anchor href="#mistakes">Mistakes</Anchor>
        <Anchor href="#structures">Structures</Anchor>
        <Anchor href="#tactics">Tactics</Anchor>
        <Anchor href="#keep">Keep these</Anchor>
        <Anchor href="#now">Three things now</Anchor>
      </nav>

      <Section id="deciders" title="How games are decided">
        <p className="font-mono text-sm">{document.deciders.record}</p>
        <p className="mt-3 max-w-[62ch] text-base leading-7">{document.deciders.story}</p>
      </Section>

      <Section id="clock" title="Clock">
        <p className="max-w-[62ch] text-base leading-7">{document.clock.story}</p>
      </Section>

      <Section id="mistakes" title="Recurring mistakes">
        {document.mistakes.map((block) => (
          <Block key={block.name} name={block.name} story={block.story} citations={block.citations} />
        ))}
      </Section>

      {document.structures.length > 0 ? (
        <Section id="structures" title="Structures and lines">
          {document.structures.map((block) => (
            <Block key={block.name} name={block.name} story={block.story} citations={block.citations} />
          ))}
        </Section>
      ) : null}

      {document.tactics.length > 0 ? (
        <Section id="tactics" title="Tactics">
          {document.tactics.map((block) => (
            <Block key={block.name} name={block.name} story={block.story} citations={block.citations} />
          ))}
        </Section>
      ) : null}

      {document.keep.length > 0 ? (
        <Section id="keep" title="Keep these">
          {document.keep.map((block) => (
            <Block key={block.name} name={block.name} story={block.story} citations={block.citations} />
          ))}
        </Section>
      ) : null}

      <Section id="now" title="Three things now">
        <ol className="flex flex-col gap-4">
          {document.now.map((item, index) => (
            <li key={item.stepId} className="border-2 border-ink bg-bg-white-0 p-4 shadow-regular-xs">
              <p className="font-mono text-sm">
                0{index + 1} · {item.title}
              </p>
              <p className="mt-2 max-w-[62ch] text-base leading-7">{item.why}</p>
              <CitationLinks citations={item.citations} />
              <Link
                href="/roadmap"
                className="mt-3 inline-block font-display text-sm font-bold underline decoration-2 underline-offset-4"
              >
                Open the syllabus
              </Link>
            </li>
          ))}
        </ol>
      </Section>
    </article>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h3 className="font-display text-2xl font-extrabold">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Block({ name, story, citations }: { name: string; story: string; citations: Citation[] }) {
  return (
    <div className="mt-4 border-2 border-ink bg-bg-white-0 p-4 shadow-regular-xs">
      <h4 className="font-display text-lg font-extrabold">{name}</h4>
      <p className="mt-2 max-w-[62ch] text-base leading-7">{story}</p>
      <CitationLinks citations={citations} />
    </div>
  );
}

function CitationLinks({ citations }: { citations: Citation[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {citations.map((citation) => (
        <li key={`${citation.gameId}-${citation.ply}`}>
          <Link
            href={`/games/${citation.gameId}?ply=${citation.ply}`}
            className="border-2 border-ink bg-bg-weak-50 px-2 py-1 font-mono text-sm hover:bg-bg-white-0"
          >
            {citation.playedSan} → {citation.bestSan}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Anchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="underline decoration-2 underline-offset-4">
      {children}
    </a>
  );
}
