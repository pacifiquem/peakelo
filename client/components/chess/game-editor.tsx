'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  annotatePly,
  applyUciLineFrom,
  evalAtPly,
  nextBestUci,
  replayPgn,
  uciSquares,
  type Color,
  type MoveAnnotation,
  type ReplayPly,
} from '@peakelo/engine';
import type { AnalyzedPly, GameBrief, Lesson, LessonArrow, PublicGameAnalysis } from '@peakelo/shared';
import { RiArrowLeftSLine, RiArrowRightSLine, RiSkipLeftLine, RiSkipRightLine } from '@remixicon/react';

import { AnnotationMark } from '@/components/chess/annotation-mark';
import { EvalBar } from '@/components/chess/eval-bar';
import { LessonDesk } from '@/components/chess/lesson-desk';
import { LichessBoard, type BoardShape } from '@/components/chess/lichess-board';
import { StudyDesk } from '@/components/chess/study-desk';
import * as Button from '@/components/ui/button';
import { askLesson, fetchGameBrief, fetchLesson, isLessonOffline, lessonErrorMessage } from '@/lib/lesson';
import { annotationBrush } from '@/lib/move-annotation';
import { showError } from '@/components/ui/toast';
import { cn } from '@/utils/cn';

type Variation = {
  plies: ReplayPly[];
  cursor: number;
  playing: boolean;
};

export function GameEditor({
  gameId,
  pgn,
  orientation,
  analysis,
}: {
  gameId: string;
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
  const [variation, setVariation] = useState<Variation | null>(null);
  const [lessons, setLessons] = useState<Map<number, Lesson>>(new Map());
  const [lessonMeta, setLessonMeta] = useState<Map<number, { offline: boolean; error: string | null }>>(
    new Map(),
  );
  const [teachingPly, setTeachingPly] = useState<number | null>(null);
  const [brief, setBrief] = useState<GameBrief | null>(null);
  const [briefReady, setBriefReady] = useState(false);
  const [asking, setAsking] = useState(false);
  const [pane, setPane] = useState<'board' | 'panel'>('board');
  const [thread, setThread] = useState<{ ply: number; items: { role: 'player' | 'coach'; text: string }[] }>({
    ply,
    items: [],
  });
  const lesson = lessons.get(ply) ?? null;
  const lessonOffline = lessonMeta.get(ply)?.offline ?? false;
  const lessonError = lessonMeta.get(ply)?.error ?? null;
  const lessonLoading = teachingPly === ply;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (variation) {
          stepVariation(-1);
          return;
        }
        go(ply - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (variation) {
          stepVariation(1);
          return;
        }
        go(ply + 1);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        if (variation) {
          setVariation((current) => (current ? { ...current, cursor: 0, playing: false } : current));
          return;
        }
        go(0);
      }
      if (event.key === 'End') {
        event.preventDefault();
        if (variation) {
          setVariation((current) =>
            current ? { ...current, cursor: current.plies.length, playing: false } : current,
          );
          return;
        }
        go(maxPly);
      }
      if (event.key === 'Escape' && variation) {
        event.preventDefault();
        setVariation(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchGameBrief(gameId, {}, controller.signal)
      .then((next) => {
        setBrief(next);
        setBriefReady(true);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setBrief(null);
        setBriefReady(true);
        if (!isLessonOffline(error)) showError(lessonErrorMessage(error));
      });
    return () => controller.abort();
  }, [gameId]);

  function storeLesson(nextPly: number, next: Lesson) {
    setLessons((current) => {
      const map = new Map(current);
      map.set(nextPly, next);
      return map;
    });
    setLessonMeta((current) => {
      const map = new Map(current);
      map.set(nextPly, { offline: false, error: null });
      return map;
    });
  }

  function teachPly() {
    if (lessons.has(ply) || teachingPly === ply) return;
    const controller = new AbortController();
    setTeachingPly(ply);
    void fetchLesson(gameId, { ply }, controller.signal)
      .then((next) => {
        storeLesson(ply, next);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const offline = isLessonOffline(error);
        setLessonMeta((current) => {
          const map = new Map(current);
          map.set(ply, { offline, error: lessonErrorMessage(error) });
          return map;
        });
        if (!offline) showError(lessonErrorMessage(error));
      })
      .finally(() => {
        setTeachingPly((current) => (current === ply ? null : current));
      });
  }

  useEffect(() => {
    if (!variation?.playing) return;
    if (variation.cursor >= variation.plies.length) return;
    const timer = window.setTimeout(() => {
      setVariation((current) => {
        if (!current?.playing) return current;
        const next = current.cursor + 1;
        return { ...current, cursor: next, playing: next < current.plies.length };
      });
    }, 360);
    return () => window.clearTimeout(timer);
  }, [variation]);

  function go(next: number) {
    setVariation(null);
    const clamped = Math.min(maxPly, Math.max(0, next));
    const query = new URLSearchParams(params.toString());
    query.set('ply', String(clamped));
    router.replace(`?${query.toString()}`, { scroll: false });
  }

  function toggleBest() {
    setShowBest((current) => !current);
  }

  function stepVariation(delta: number) {
    setVariation((current) => {
      if (!current) return current;
      const next = Math.min(current.plies.length, Math.max(0, current.cursor + delta));
      return { ...current, cursor: next, playing: false };
    });
  }

  function enterLine(uci: string[]) {
    const mainline = ply === 0 ? null : (replayed.plies[ply - 1] ?? null);
    const shownVariation =
      variation && variation.cursor > 0 ? (variation.plies[variation.cursor - 1] ?? null) : null;
    const displayed = shownVariation?.fen ?? mainline?.fen ?? replayed.startFen;
    const before = mainline?.fenBefore ?? replayed.startFen;
    const applied = applyUciLineFrom([displayed, lesson?.fen ?? '', before], uci);
    if (!applied.legal || applied.plies.length === 0) {
      showError('That line is not legal from this position.');
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPane('board');
    setVariation({
      plies: applied.plies,
      cursor: reduceMotion ? applied.plies.length : 0,
      playing: !reduceMotion,
    });
  }

  function askAboutPosition(question: string) {
    setAsking(true);
    const history = thread.ply === ply ? thread.items : [];
    void askLesson(gameId, {
      ply,
      question,
      history,
      variationUci: variation ? variation.plies.slice(0, variation.cursor).map((item) => item.uci) : undefined,
    })
      .then((next) => {
        storeLesson(ply, next);
        const nextThread: { role: 'player' | 'coach'; text: string }[] = [
          ...history,
          { role: 'player', text: question },
          { role: 'coach', text: [next.headline, ...next.segments.map((segment) => segment.text)].join(' ') },
        ];
        setThread({ ply, items: nextThread.slice(-8) });
      })
      .catch((error: unknown) => {
        showError(lessonErrorMessage(error));
        if (isLessonOffline(error)) {
          setLessonMeta((current) => {
            const map = new Map(current);
            map.set(ply, { offline: true, error: lessonErrorMessage(error) });
            return map;
          });
        }
      })
      .finally(() => setAsking(false));
  }

  const current = ply === 0 ? null : replayed.plies[ply - 1];
  const variationPly = variation && variation.cursor > 0 ? variation.plies[variation.cursor - 1] : null;
  const fen = variationPly?.fen ?? current?.fen ?? replayed.startFen;
  const lastMove = variationPly
    ? uciSquares(variationPly.uci)
    : current
      ? uciSquares(current.uci)
      : null;
  const played = ply === 0 || variation ? null : (byPly.get(ply) ?? null);
  const upcomingUci =
    ready && !variation && !lesson?.arrows.some((arrow) => arrow.brush === 'green')
      ? nextBestUci(analysis.plies ?? [], ply)
      : null;
  const nextVariationUci =
    variation && variation.cursor < variation.plies.length
      ? variation.plies[variation.cursor]?.uci ?? null
      : null;
  const evalScore = ready && !variation ? evalAtPly(analysis.plies ?? [], ply) : null;
  const playedNote = played ? annotatePly(played) : null;
  const shapes = boardShapes({
    ready,
    showBest,
    upcomingUci,
    lastMove,
    playedNote,
    lessonArrows: variation && variation.cursor > 0 ? [] : (lesson?.arrows ?? []),
    nextVariationUci,
  });

  const atStart = variation ? variation.cursor === 0 : ply === 0;
  const atEnd = variation ? variation.cursor >= variation.plies.length : ply === maxPly;

  return (
    <StudyDesk
      pane={pane}
      onPane={setPane}
      board={
        <>
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
            <Button.Root
              type="button"
              variant="neutral"
              mode="stroke"
              size="small"
              disabled={atStart}
              onClick={() => (variation ? stepVariation(-variation.cursor) : go(0))}
              aria-label="Start position"
            >
              <RiSkipLeftLine className="size-4" />
            </Button.Root>
            <Button.Root
              type="button"
              variant="neutral"
              mode="stroke"
              size="small"
              disabled={atStart}
              onClick={() => (variation ? stepVariation(-1) : go(ply - 1))}
              aria-label="Previous move"
            >
              <RiArrowLeftSLine className="size-4" />
            </Button.Root>
            <Button.Root
              type="button"
              variant="neutral"
              mode="stroke"
              size="small"
              disabled={atEnd}
              onClick={() => (variation ? stepVariation(1) : go(ply + 1))}
              aria-label="Next move"
            >
              <RiArrowRightSLine className="size-4" />
            </Button.Root>
            <Button.Root
              type="button"
              variant="neutral"
              mode="stroke"
              size="small"
              disabled={atEnd}
              onClick={() =>
                variation
                  ? setVariation((current) =>
                      current ? { ...current, cursor: current.plies.length, playing: false } : current,
                    )
                  : go(maxPly)
              }
              aria-label="Last move"
            >
              <RiSkipRightLine className="size-4" />
            </Button.Root>
            <span className="font-mono text-sm text-text-strong-950">
              {variation ? `line ${variation.cursor} / ${variation.plies.length}` : `${ply} / ${maxPly}`}
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
          <MoveList plies={replayed.plies} current={ply} onSelect={go} byPly={ready ? byPly : null} />
        </>
      }
      panel={
        <div className="flex flex-col gap-3">
          {variation && variation.plies.length > 0 ? (
            <ol className="flex flex-wrap gap-1 font-mono text-sm">
              {variation.plies.map((item, index) => (
                <li key={`${item.uci}-${index}`}>
                  <button
                    type="button"
                    className={cn(
                      'border-2 border-ink px-2 py-1',
                      variation.cursor === index + 1
                        ? 'bg-primary-base font-bold text-text-white-0'
                        : 'bg-bg-white-0',
                    )}
                    onClick={() =>
                      setVariation((current) =>
                        current ? { ...current, cursor: index + 1, playing: false } : current,
                      )
                    }
                  >
                    {item.san}
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
          <LessonDesk
            brief={brief}
            lesson={lesson}
            briefLoading={!briefReady}
            lessonLoading={lessonLoading}
            offline={lessonOffline}
            error={lessonError}
            variationActive={Boolean(variation)}
            onEnterLine={enterLine}
            onLeaveVariation={() => setVariation(null)}
            onAsk={(question) => {
              setPane('panel');
              askAboutPosition(question);
            }}
            onSelectPly={(next) => {
              setPane('board');
              go(next);
            }}
            onTeach={() => {
              setPane('panel');
              teachPly();
            }}
            asking={asking}
          />
        </div>
      }
    />
  );
}

function boardShapes({
  ready,
  showBest,
  upcomingUci,
  lastMove,
  playedNote,
  lessonArrows,
  nextVariationUci,
}: {
  ready: boolean;
  showBest: boolean;
  upcomingUci: string | null;
  lastMove: { from: NonNullable<ReturnType<typeof uciSquares>>['from']; to: NonNullable<ReturnType<typeof uciSquares>>['to'] } | null;
  playedNote: MoveAnnotation | null;
  lessonArrows: LessonArrow[];
  nextVariationUci: string | null;
}): BoardShape[] {
  const shapes: BoardShape[] = [];
  if (ready && lastMove && playedNote) {
    shapes.push({ from: lastMove.to, brush: annotationBrush(playedNote) });
  }
  if (showBest && upcomingUci) {
    const best = uciSquares(upcomingUci);
    if (best) shapes.push({ from: best.from, to: best.to, brush: 'green' });
  }
  if (nextVariationUci) {
    const next = uciSquares(nextVariationUci);
    if (next) shapes.push({ from: next.from, to: next.to, brush: 'paleGreen' });
  }
  for (const arrow of lessonArrows) {
    shapes.push({ from: arrow.from as BoardShape['from'], to: arrow.to as BoardShape['to'], brush: arrow.brush });
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
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-current-ply="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [current]);

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
    <ol
      ref={listRef}
      className="max-h-64 overflow-auto border-2 border-ink bg-bg-white-0 font-mono text-sm shadow-regular-xs"
    >
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
      data-current-ply={active ? 'true' : undefined}
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
