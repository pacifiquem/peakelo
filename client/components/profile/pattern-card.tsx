import type { Writeup } from '@peakelo/shared';

import { CitationChips } from '@/components/profile/citation-chips';

export function PatternCard({
  name,
  story,
  citations,
}: {
  name: string;
  story: string;
  citations: Writeup['mistakes'][number]['citations'];
}) {
  return (
    <article className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
      <h2 className="font-display text-xl font-extrabold">{name}</h2>
      <p className="mt-3 max-w-[62ch] text-base leading-7 text-text-strong-950">{story}</p>
      <CitationChips citations={citations} />
    </article>
  );
}
