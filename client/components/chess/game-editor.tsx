'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  annotatePly,
  evalAtPly,
  nextBestUci,
  replayPgn,
  uciSquares,
  type Color,
  type MoveAnnotation,
  type ReplayPly,
} from '@peakelo/engine';
import type { AnalyzedPly, PublicGameAnalysis } from '@peakelo/shared';
import { RiArrowLeftSLine, RiArrowRightSLine, RiSkipLeftLine, RiSkipRightLine } from '@remixicon/react';

import { AnnotationMark } from '@/components/chess/annotation-mark';
import { EvalBar } from '@/components/chess/eval-bar';
import { LichessBoard, type BoardShape } from '@/components/chess/lichess-board';
import * as Button from '@/components/ui/button';
import { annotationBrush } from '@/lib/move-annotation';
import { cn } from '@/utils/cn';

export function GameEditor({
  pgn,
  orientation,
  analysis,
}: {
  pgn: string;
  orientation: Color;
  analysis: PublicGameAnalysis;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const replayed = useMemo(() => replayPgn(pgn), [pgn]);
  const maxPly = replayed.plies.length;
  const requested = Number(params.get('ply'));
  const ply = Number.isFinite(requested)
    ? Math.min(maxPly, Math.max(0, Math.trunc(requested)))
    : 0;
  const ready = analysis.status === 'ready' && analysis.plies !== null;
  const byPly = useMemo(() => {
    const map = new Map<number, AnalyzedPly>();
    for (const item of analysis.plies ?? []) map.set(item.ply, item);
    return map;
  }, [analysis.plies]);

  const [showBest, setShowBest] = useState(false);

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

  function toggleBest() {
    setShowBest((current) => !current);
  }

  const current = ply === 0 ? null : replayed.plies[ply - 1];
  const fen = current?.fen ?? replayed.startFen;
  const lastMove = current ? uciSquares(current.uci) : null;
  const played = ply === 0 ? null : (byPly.get(ply) ?? null);
  const upcomingUci = ready ? nextBestUci(analysis.plies ?? [], ply) : null;
  const evalScore = ready ? evalAtPly(analysis.plies ?? [], ply) : null;
  const playedNote = played ? annotatePly(played) : null;
  const shapes = boardShapes({
    ready,
    showBest,
    upcomingUci,
    lastMove,
    playedNote,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,600px)_minmax(16rem,1fr)] lg:items-start">
      <div className="flex flex-col gap-3">
        <div className="flex items-stretch gap-2">
          {evalScore ? <EvalBar score={evalScore} orientation={orientation} /> : null}
          <LichessBoard fen={fen} orientation={orientation} lastMove={lastMove} shapes={shapes} />
        </div>
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
          <Button.Root
            type="button"
            variant={showBest ? 'primary' : 'neutral'}
            mode={showBest ? 'filled' : 'stroke'}
            size="small"
            disabled={!ready || !upcomingUci}
            aria-pressed={showBest}
            onClick={toggleBest}
            className="w-fit"
          >
            Best move
          </Button.Root>
        </div>
        {playedNote ? (
          <p className="flex items-center gap-2 text-sm text-text-strong-950">
            <AnnotationMark note={playedNote} withLabel />
            {played && played.bestSan && played.uci !== played.bestUci ? (
              <span className="font-mono">engine {played.bestSan}</span>
            ) : null}
          </p>
        ) : null}
        {!ready ? (
          <p className="text-sm text-text-sub-600">
            {analysis.status === 'failed'
              ? 'The engine could not finish this game.'
              : analysis.status === 'none'
                ? 'No engine pass on this game yet.'
                : 'This game is still in the engine pass. The bar and glyphs wait for real evals.'}
          </p>
        ) : null}
      </div>
      <MoveList plies={replayed.plies} current={ply} onSelect={go} byPly={ready ? byPly : null} />
    </div>
  );
}

function boardShapes({
  ready,
  showBest,
  upcomingUci,
  lastMove,
  playedNote,
}: {
  ready: boolean;
  showBest: boolean;
  upcomingUci: string | null;
  lastMove: { from: NonNullable<ReturnType<typeof uciSquares>>['from']; to: NonNullable<ReturnType<typeof uciSquares>>['to'] } | null;
  playedNote: MoveAnnotation | null;
}): BoardShape[] {
  if (!ready) return [];
  const shapes: BoardShape[] = [];
  if (lastMove && playedNote) {
    shapes.push({ from: lastMove.to, brush: annotationBrush(playedNote) });
  }
  if (showBest && upcomingUci) {
    const best = uciSquares(upcomingUci);
    if (best) shapes.push({ from: best.from, to: best.to, brush: 'green' });
  }
  return shapes;
}

function MoveList({
  plies,
  current,
  onSelect,
  byPly,
}: {
  plies: ReplayPly[];
  current: number;
  onSelect: (ply: number) => void;
  byPly: Map<number, AnalyzedPly> | null;
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
          <MoveCell ply={row.white} current={current} onSelect={onSelect} analyzed={byPly} />
          <MoveCell ply={row.black} current={current} onSelect={onSelect} analyzed={byPly} />
        </li>
      ))}
    </ol>
  );
}

function MoveCell({
  ply,
  current,
  onSelect,
  analyzed,
}: {
  ply?: ReplayPly;
  current: number;
  onSelect: (ply: number) => void;
  analyzed: Map<number, AnalyzedPly> | null;
}) {
  if (!ply) return <span />;
  const active = current === ply.ply;
  const note = analyzed?.get(ply.ply) ? annotatePly(analyzed.get(ply.ply)!) : null;
  return (
    <button
      type="button"
      onClick={() => onSelect(ply.ply)}
      className={cn(
        'px-2 py-1.5 text-left',
        active ? 'bg-primary-base font-bold text-text-white-0' : 'hover:bg-bg-weak-50',
      )}
    >
      <span className="inline-flex items-center gap-1">
        {ply.san}
        {note ? <AnnotationMark note={note} inverted={active} /> : null}
      </span>
    </button>
  );
}
