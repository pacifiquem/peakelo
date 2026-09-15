'use client';

import { useState } from 'react';
import Link from 'next/link';
import { applyUciLine, uciFromSquares, uciSquares, type Color, type Square } from '@peakelo/engine';
import type { DrillInsight, DrillPlay, EvalScore, Lesson, LessonSegment } from '@peakelo/shared';
import { DRILL_KIND_LABEL } from '@peakelo/shared';
import { RiQuestionLine } from '@remixicon/react';

import { EvalBar } from '@/components/chess/eval-bar';
import { LichessBoard, type BoardShape } from '@/components/chess/lichess-board';
import * as Button from '@/components/ui/button';
import * as Input from '@/components/ui/input';
import { cn } from '@/utils/cn';

export function DrillDesk({
  drill,
  fen,
  dests,
  lastMove,
  insight,
  solved,
  asking,
  answer,
  onMove,
  onAsk,
  onRetry,
  onExplore,
  nextHref,
  evalScore,
}: {
  drill: DrillPlay;
  fen: string;
  dests: Record<string, string[]>;
  lastMove: { from: Square; to: Square } | null;
  insight: DrillInsight | null;
  solved: boolean;
  asking: boolean;
  answer: Lesson | null;
  evalScore: EvalScore | null;
  onMove: (uci: string) => void;
  onAsk: (question: string) => void;
  onRetry: () => void;
  onExplore: (uci: string[]) => void;
  nextHref: string;
}) {
  const [question, setQuestion] = useState('');
  const shapes: BoardShape[] = (insight?.arrows ?? []).map((arrow) => ({
    from: arrow.from as Square,
    to: arrow.to as Square,
    brush: arrow.brush,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-stretch gap-2">
          {evalScore ? <EvalBar score={evalScore} orientation={drill.playerColor} /> : null}
          <LichessBoard
            fen={fen}
            orientation={drill.playerColor}
            lastMove={lastMove}
            shapes={shapes}
            dests={solved ? undefined : dests}
            movableColor={solved ? undefined : (drill.playerColor as Color)}
            onMove={(from, to) => {
              const uci = uciFromSquares(fen, from, to);
              if (uci) onMove(uci);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button.Root type="button" variant="neutral" mode="stroke" className="w-fit" onClick={onRetry}>
            Try again
          </Button.Root>
          <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
            <Link href={`/games/${drill.sourceGameId}?ply=${drill.sourcePly}`}>See the game</Link>
          </Button.Root>
          <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
            <Link href={nextHref}>Next drill</Link>
          </Button.Root>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
          <p className="font-mono text-sm text-text-sub-600">{DRILL_KIND_LABEL[drill.kind]}</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">Your move.</h2>
          <p className="mt-3 max-w-[62ch] text-base leading-7 text-text-strong-950">{drill.stem}</p>
        </section>

        {insight ? (
          <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
            <h3 className="font-display text-xl font-extrabold">{insight.headline}</h3>
            <p className="mt-3 max-w-[62ch] text-base leading-7">
              {insight.segments.map((segment, index) => (
                <SegmentText key={segment.id} segment={segment} pad={index > 0} onEnterLine={onExplore} />
              ))}
            </p>
          </section>
        ) : null}

        {answer ? (
          <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
            <p className="font-mono text-sm text-text-sub-600">Ask</p>
            <h3 className="mt-2 font-display text-xl font-extrabold">{answer.headline}</h3>
            <p className="mt-3 max-w-[62ch] text-base leading-7">
              {answer.segments.map((segment, index) => (
                <SegmentText key={segment.id} segment={segment} pad={index > 0} onEnterLine={onExplore} />
              ))}
            </p>
          </section>
        ) : null}

        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            const next = question.trim();
            if (!next || asking) return;
            onAsk(next);
            setQuestion('');
          }}
        >
          <Input.Root className="flex-1">
            <Input.Wrapper>
              <Input.Icon as={RiQuestionLine} />
              <Input.Input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={500}
                placeholder="Ask about this position"
                aria-label="Ask about this position"
                disabled={asking}
              />
            </Input.Wrapper>
          </Input.Root>
          <Button.Root type="submit" className="w-full sm:w-fit" disabled={asking || question.trim().length === 0}>
            Ask
          </Button.Root>
        </form>
      </div>
    </div>
  );
}

function SegmentText({
  segment,
  pad,
  onEnterLine,
}: {
  segment: LessonSegment;
  pad: boolean;
  onEnterLine: (uci: string[]) => void;
}) {
  const clickable = Boolean(segment.lineUci && segment.lineUci.length > 0);
  const className = cn(pad && 'ml-1', clickable && 'cursor-pointer font-medium underline decoration-2 underline-offset-4');
  if (!clickable) return <span className={className}>{segment.text}</span>;
  return (
    <button
      type="button"
      className={cn(className, 'bg-transparent p-0 text-left text-inherit')}
      onClick={() => onEnterLine(segment.lineUci ?? [])}
    >
      {segment.text}
    </button>
  );
}

export function lastMoveFromUci(uci: string | null): { from: Square; to: Square } | null {
  if (!uci) return null;
  return uciSquares(uci);
}

export function fenAfterLine(start: string, line: string[]): string {
  const applied = applyUciLine(start, line);
  return applied.legal ? applied.fen : start;
}
