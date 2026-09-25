'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RiLoader4Line } from '@remixicon/react';
import type { EnginePass } from '@peakelo/shared';

import { showInfo } from '@/components/ui/toast';
import { passGameTotal } from '@/lib/engine-pass';
import { cn } from '@/utils/cn';

const NOTIFIED_KEY = 'peakelo.enginePass.notified';

export function EnginePassBanner({ pass }: { pass: EnginePass }) {
  useEffect(() => {
    let shouldNotify = true;
    try {
      if (sessionStorage.getItem(NOTIFIED_KEY)) {
        shouldNotify = false;
      } else {
        sessionStorage.setItem(NOTIFIED_KEY, '1');
      }
    } catch {
      // private mode: toast this mount only
    }
    if (shouldNotify) {
      showInfo('I’m reading your games in the background.');
    }
  }, []);

  return (
    <div className="px-4 py-3 lg:px-6">
      <section
        role="status"
        aria-live="polite"
        className="border-2 border-l-4 border-ink border-l-cyan bg-bg-white-0 px-4 py-3 shadow-regular-xs"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <RiLoader4Line
              className="mt-0.5 size-5 shrink-0 motion-safe:animate-spin"
              aria-hidden
            />
            <div className="min-w-0">
              <h2 className="font-display text-base font-extrabold">Reading your games</h2>
              <p className="mt-1 max-w-[62ch] text-sm leading-6 text-text-strong-950">
                Every imported move goes through the engine. Your profile lands when that’s done.
              </p>
              <EnginePassCounts pass={pass} className="mt-2" />
            </div>
          </div>
          <Link
            href="/profile"
            className="shrink-0 font-display text-sm font-bold underline decoration-2 underline-offset-4 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Open profile
          </Link>
        </div>
      </section>
    </div>
  );
}

export function EnginePassCounts({
  pass,
  className,
}: {
  pass: EnginePass;
  className?: string;
}) {
  const total = passGameTotal(pass);
  return (
    <p className={cn('font-mono text-sm text-text-strong-950', className)}>
      {pass.gamesReady} / {total} games · {pass.movesAnalyzed} / {pass.movesTotal} moves
      {pass.gamesFailed > 0 ? ` · ${pass.gamesFailed} failed` : ''}
    </p>
  );
}