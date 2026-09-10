'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  replayPgn,
  uciSquares,
  type Color,
  type ReplayPly,
} from '@peakelo/engine';
import { RiArrowLeftSLine, RiArrowRightSLine, RiSkipLeftLine, RiSkipRightLine } from '@remixicon/react';

import { LichessBoard } from '@/components/chess/lichess-board';
import * as Button from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function GameEditor({
  pgn,
  orientation,
}: {
  pgn: string;
  orientation: Color;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const replayed = useMemo(() => replayPgn(pgn), [pgn]);
  const maxPly = replayed.plies.length;
  const requested = Number(params.get('ply'));
  const ply = Number.isFinite(requested)
    ? Math.min(maxPly, Math.max(0, Math.trunc(requested)))
    : 0;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(ply - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(ply + 1);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        go(0);
      }
      if (event.key === 'End') {
        event.preventDefault();
        go(maxPly);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function go(next: number) {
    const clamped = Math.min(maxPly, Math.max(0, next));
    const query = new URLSearchParams(params.toString());
    query.set('ply', String(clamped));
    router.replace(`?${query.toString()}`, { scroll: false });
  }

  const current = ply === 0 ? null : replayed.plies[ply - 1];
  const fen = current?.fen ?? replayed.startFen;
  const lastMove = current ? uciSquares(current.uci) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_minmax(16rem,1fr)] lg:items-start">
      <div className="flex flex-col gap-3">
        <LichessBoard fen={fen} orientation={orientation} lastMove={lastMove} />
        <div className="flex flex-wrap items-center gap-2">
          <Button.Root
            type="button"
            variant="neutral"
            mode="stroke"
            size="small"
            disabled={ply === 0}
            onClick={() => go(0)}
            aria-label="Start position"
          >
            <RiSkipLeftLine className="size-4" />
          </Button.Root>
          <Button.Root
            type="button"
            variant="neutral"
            mode="stroke"
            size="small"
            disabled={ply === 0}
            onClick={() => go(ply - 1)}
            aria-label="Previous move"
          >
            <RiArrowLeftSLine className="size-4" />
          </Button.Root>
          <Button.Root
            type="button"
            variant="neutral"
            mode="stroke"
            size="small"
            disabled={ply === maxPly}
            onClick={() => go(ply + 1)}
            aria-label="Next move"
          >
            <RiArrowRightSLine className="size-4" />
          </Button.Root>
          <Button.Root
            type="button"
            variant="neutral"
            mode="stroke"
            size="small"
            disabled={ply === maxPly}
            onClick={() => go(maxPly)}
            aria-label="Last move"
          >
            <RiSkipRightLine className="size-4" />
          </Button.Root>
          <span className="font-mono text-sm text-text-strong-950">
            {ply} / {maxPly}
          </span>
        </div>
      </div>
      <MoveList plies={replayed.plies} current={ply} onSelect={go} />
    </div>
  );
}

function MoveList({
  plies,
  current,
  onSelect,
}: {
  plies: ReplayPly[];
  current: number;
  onSelect: (ply: number) => void;
}) {
  const rows: { number: number; white?: ReplayPly; black?: ReplayPly }[] = [];
  for (const ply of plies) {
    const number = Math.ceil(ply.ply / 2);
    const row = rows[number - 1] ?? { number };
    if (ply.ply % 2 === 1) row.white = ply;
    else row.black = ply;
    rows[number - 1] = row;
  }

  if (plies.length === 0) {
    return (
      <p className="text-sm text-text-strong-950">No moves in this scoresheet.</p>
    );
  }

  return (
    <ol className="max-h-[560px] overflow-auto border-2 border-ink bg-bg-white-0 font-mono text-sm shadow-regular-xs">
      {rows.map((row) => (
        <li
          key={row.number}
          className="grid grid-cols-[2.5rem_1fr_1fr] border-b border-ink last:border-b-0"
        >
          <span className="bg-bg-weak-50 px-2 py-1.5 text-text-strong-950">{row.number}.</span>
          <MoveCell ply={row.white} current={current} onSelect={onSelect} />
          <MoveCell ply={row.black} current={current} onSelect={onSelect} />
        </li>
      ))}
    </ol>
  );
}

function MoveCell({
  ply,
  current,
  onSelect,
}: {
  ply?: ReplayPly;
  current: number;
  onSelect: (ply: number) => void;
}) {
  if (!ply) return <span />;
  const active = current === ply.ply;
  return (
    <button
      type="button"
      onClick={() => onSelect(ply.ply)}
      className={cn(
        'px-2 py-1.5 text-left',
        active ? 'bg-primary-base font-bold text-text-white-0' : 'hover:bg-bg-weak-50',
      )}
    >
      {ply.san}
    </button>
  );
}
