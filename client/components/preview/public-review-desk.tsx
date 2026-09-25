'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  annotatePly,
  evalAtPly,
  nextBestUci,
  replayPgn,
  uciSquares,
  type Color,
} from '@peakelo/engine';
import type { AnalyzedPly, PublicReview } from '@peakelo/shared';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiSkipLeftLine,
  RiSkipRightLine,
} from '@remixicon/react';

import { AnnotationMark } from '@/components/chess/annotation-mark';
import { EvalBar } from '@/components/chess/eval-bar';
import { LichessBoard } from '@/components/chess/lichess-board';
import * as Button from '@/components/ui/button';
import { annotationBrush } from '@/lib/move-annotation';

export function PublicReviewDesk({ review }: { review: PublicReview }) {
  const replayed = useMemo(() => replayPgn(review.pgn), [review.pgn]);
  const maxPly = replayed.plies.length;
  const [ply, setPly] = useState(0);
  const [orientation, setOrientation] = useState<Color>('white');
  const [showBest, setShowBest] = useState(false);
  const byPly = useMemo(() => {
    const map = new Map<number, AnalyzedPly>();
    for (const item of review.analysis.plies ?? []) map.set(item.ply, item);
    return map;
  }, [review.analysis.plies]);

  const current = ply === 0 ? null : replayed.plies[ply - 1];
  const fen = current?.fen ?? replayed.startFen;
  const lastMove = current ? uciSquares(current.uci) : null;
  const played = ply === 0 ? null : (byPly.get(ply) ?? null);
  const ready = review.analysis.status === 'ready';
  const analyzed = useMemo(() => review.analysis.plies ?? [], [review.analysis.plies]);
  const swings = useMemo(
    () =>
      [...analyzed]
        .filter((item) => {
          const note = annotatePly(item);
          return note === 'blunder' || note === 'mistake' || note === 'miss';
        })
        .sort((a, b) => b.cpl - a.cpl)
        .slice(0, 6),
    [analyzed],
  );
  const evalScore = ready ? evalAtPly(analyzed, ply) : null;
  const upcomingUci = ready && showBest ? nextBestUci(analyzed, ply) : null;
  const playedNote = played ? annotatePly(played) : null;
  const shapes = [
    ...(lastMove ? [{ from: lastMove.from, to: lastMove.to, brush: 'paleGreen' }] : []),
    ...(upcomingUci
      ? (() => {
          const sq = uciSquares(upcomingUci);
          return sq ? [{ from: sq.from, to: sq.to, brush: 'green' as const }] : [];
        })()
      : []),
    ...(playedNote && lastMove
      ? [{ from: lastMove.from, to: lastMove.to, brush: annotationBrush(playedNote) }]
      : []),
  ];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3 lg:sticky lg:top-16">
        <div className="flex items-stretch gap-2">
          {evalScore ? <EvalBar score={evalScore} orientation={orientation} /> : null}
          <LichessBoard
            fen={fen}
            orientation={orientation}
            lastMove={lastMove}
            shapes={shapes}
            className="max-w-full"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Nav disabled={ply === 0} label="Start position" onClick={() => setPly(0)}>
            <RiSkipLeftLine className="size-4" />
          </Nav>
          <Nav disabled={ply === 0} label="Previous move" onClick={() => setPly(ply - 1)}>
            <RiArrowLeftSLine className="size-4" />
          </Nav>
          <Nav disabled={ply >= maxPly} label="Next move" onClick={() => setPly(ply + 1)}>
            <RiArrowRightSLine className="size-4" />
          </Nav>
          <Nav disabled={ply >= maxPly} label="Last move" onClick={() => setPly(maxPly)}>
            <RiSkipRightLine className="size-4" />
          </Nav>
          <span className="font-mono text-sm">
            {ply} / {maxPly}
          </span>
          <Button.Root
            type="button"
            variant="neutral"
            mode="stroke"
            size="small"
            className="w-fit"
            onClick={() => setShowBest((current) => !current)}
          >
            {showBest ? 'Hide best' : 'Best move'}
          </Button.Root>
          <Button.Root
            type="button"
            variant="neutral"
            mode="stroke"
            size="small"
            className="w-fit"
            onClick={() => setOrientation((current) => (current === 'white' ? 'black' : 'white'))}
          >
            Flip
          </Button.Root>
        </div>
        <ol className="max-h-64 overflow-auto border-2 border-ink bg-bg-white-0">
          {pairMoves(replayed.plies).map((row) => (
            <li key={row.number} className="flex divide-x-2 divide-ink border-b-2 border-ink last:border-b-0">
              <span className="w-8 shrink-0 px-2 py-1 font-mono text-sm">{row.number}.</span>
              {row.white ? (
                <MoveButton
                  ply={row.white.ply}
                  san={row.white.san}
                  active={ply === row.white.ply}
                  note={byPly.get(row.white.ply) ? annotatePly(byPly.get(row.white.ply)!) : null}
                  onClick={() => setPly(row.white!.ply)}
                />
              ) : null}
              {row.black ? (
                <MoveButton
                  ply={row.black.ply}
                  san={row.black.san}
                  active={ply === row.black.ply}
                  note={byPly.get(row.black.ply) ? annotatePly(byPly.get(row.black.ply)!) : null}
                  onClick={() => setPly(row.black!.ply)}
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-4">
        {review.review ? (
          <article className="border-2 border-t-4 border-ink border-t-cyan bg-bg-white-0 p-5 shadow-regular-xs">
            <p className="flex items-center gap-2 font-mono text-sm text-text-sub-600">
              <span className="size-2 bg-cyan" aria-hidden />
              Coach
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">{review.review.headline}</h2>
            <p className="mt-3 max-w-[62ch] text-base leading-7">{review.review.story}</p>
            <p className="mt-3 text-sm leading-6">
              <span className="font-display font-bold">How it was decided. </span>
              {review.review.decidedBy}
            </p>
            {review.review.opening ? (
              <p className="mt-2 font-mono text-sm">{review.review.opening}</p>
            ) : null}
            <ul className="mt-4 flex flex-col gap-2">
              {review.review.keyPlies.map((item) => (
                <li key={`${item.ply}-${item.san}`}>
                  <button
                    type="button"
                    className="w-full border-2 border-ink bg-bg-weak-50 px-3 py-2 text-left hover:bg-bg-white-0"
                    onClick={() => setPly(item.ply)}
                  >
                    <span className="font-mono text-sm font-bold">
                      {item.color} {item.san}
                    </span>
                    <span className="mt-1 block text-sm leading-6">{item.why}</span>
                  </button>
                </li>
              ))}
            </ul>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="border-2 border-t-4 border-ink border-t-gold bg-bg-white-0 p-3">
                <dt className="font-mono text-sm">White</dt>
                <dd className="mt-1 text-sm leading-6">{review.review.whiteHabit}</dd>
              </div>
              <div className="border-2 border-t-4 border-ink border-t-cyan bg-bg-white-0 p-3">
                <dt className="font-mono text-sm">Black</dt>
                <dd className="mt-1 text-sm leading-6">{review.review.blackHabit}</dd>
              </div>
            </dl>
          </article>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="max-w-[62ch] text-sm leading-6 text-text-sub-600">
              {review.status === 'queued' || review.status === 'running'
                ? 'You can step through the game. I’ll write it up after every move is read.'
                : (review.error ?? 'The board is from the engine. The writeup didn’t land.')}
            </p>
            {ready && swings.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 font-mono text-sm text-text-sub-600">
                  <span className="size-2 bg-gold" aria-hidden />
                  The moves that swung it
                </p>
                <ul className="flex flex-col gap-2">
                  {swings.map((item) => {
                    const note = annotatePly(item);
                    return (
                      <li key={`${item.ply}-${item.san}`}>
                        <button
                          type="button"
                          className="w-full border-2 border-ink bg-bg-weak-50 px-3 py-2 text-left hover:bg-bg-white-0"
                          onClick={() => setPly(item.ply)}
                        >
                          <span className="flex items-center gap-2 font-mono text-sm font-bold">
                            {item.color} {item.san}
                            {note ? <AnnotationMark note={note} /> : null}
                          </span>
                          <span className="mt-1 block font-mono text-xs text-text-sub-600">
                            ply {item.ply} · {item.cpl} cpl
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Nav({
  disabled,
  label,
  onClick,
  children,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button.Root
      type="button"
      variant="neutral"
      mode="stroke"
      size="small"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </Button.Root>
  );
}

function MoveButton({
  san,
  active,
  note,
  onClick,
}: {
  ply: number;
  san: string;
  active: boolean;
  note: ReturnType<typeof annotatePly> | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center gap-1 px-2 py-1 text-left font-mono text-sm ${
        active ? 'bg-gold/30' : 'hover:bg-bg-weak-50'
      }`}
    >
      {san}
      {note ? <AnnotationMark note={note} /> : null}
    </button>
  );
}

function pairMoves(plies: Array<{ ply: number; san: string }>) {
  const rows: Array<{
    number: number;
    white?: { ply: number; san: string };
    black?: { ply: number; san: string };
  }> = [];
  for (const item of plies) {
    const number = Math.ceil(item.ply / 2);
    const row = rows[number - 1] ?? { number };
    if (item.ply % 2 === 1) row.white = item;
    else row.black = item;
    rows[number - 1] = row;
  }
  return rows;
}


