import Link from 'next/link';
import type { Citation } from '@peakelo/shared';

export function CitationChips({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="font-mono text-sm text-text-sub-600">See it in your games</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {citations.map((citation) => (
          <li key={`${citation.gameId}-${citation.ply}-${citation.playedSan}-${citation.bestSan}`}>
            <Link
              href={`/games/${citation.gameId}?ply=${citation.ply}`}
              className="border-2 border-ink bg-bg-weak-50 px-2 py-1 font-mono text-sm hover:bg-bg-white-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              You played {citation.playedSan}
              <span className="text-text-sub-600"> · look at {citation.bestSan}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
