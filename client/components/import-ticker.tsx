'use client';

import { useEffect, useState } from 'react';

const VERBS = [
  'Fetching',
  'Indexing',
  'Cataloging',
  'Reading clocks',
  'Pulling PGNs',
  'Sorting',
  'Scanning',
  'Collating',
] as const;

const TICK_MS = 1600;

export function ImportTicker({ active }: { active: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % VERBS.length);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [active]);

  if (!active) return null;

  const verb = VERBS[index];

  return (
    <div
      className="flex w-fit max-w-full items-center gap-3 overflow-hidden border-2 border-ink bg-bg-white-0 px-3 py-2 shadow-regular-sm"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="relative h-4 w-10 shrink-0 overflow-hidden border border-ink" aria-hidden>
        <span className="flex h-full">
          {Array.from({ length: 6 }, (_, file) => (
            <span
              key={file}
              className={`h-full w-1/6 ${file % 2 === 0 ? 'bg-board' : 'bg-paper'}`}
            />
          ))}
        </span>
        <span className="import-scan absolute inset-y-0 w-1.5 bg-magenta" />
      </span>
      <span key={verb} className="import-flip font-mono text-sm font-medium text-text-strong-950">
        {verb}…
      </span>
    </div>
  );
}
