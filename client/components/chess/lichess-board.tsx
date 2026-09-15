'use client';

import { useEffect, useRef } from 'react';
import { Chessground } from '@lichess-org/chessground';
import { legalDests, sideToMove, type Color, type Square } from '@peakelo/engine';

import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import '@/components/chess/chessground.green.css';

type Ground = ReturnType<typeof Chessground>;

export type BoardShape = {
  from: Square;
  to?: Square;
  brush: string;
};

export function LichessBoard({
  fen,
  orientation,
  lastMove,
  shapes = [],
  dests,
  movableColor,
  onMove,
}: {
  fen: string;
  orientation: Color;
  lastMove?: { from: Square; to: Square } | null;
  shapes?: BoardShape[];
  dests?: Record<string, string[]>;
  movableColor?: Color;
  onMove?: (from: Square, to: Square) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Ground | null>(null);
  const moveRef = useRef(onMove);
  useEffect(() => {
    moveRef.current = onMove;
  }, [onMove]);
  const last = lastMove ? `${lastMove.from}${lastMove.to}` : '';
  const shapeKey = shapes.map((shape) => `${shape.from}${shape.to ?? ''}${shape.brush}`).join(',');
  const destKey = dests ? Object.entries(dests).map(([from, tos]) => `${from}:${tos.join('')}`).join('|') : '';

  useEffect(() => {
    if (!host.current) return;
    api.current = Chessground(
      host.current,
      boardConfig(fen, orientation, lastMove, shapes, dests, movableColor, (from, to) => {
        moveRef.current?.(from, to);
      }),
    );
    return () => {
      api.current?.destroy();
      api.current = null;
    };
    // Mount once. Position updates go through set() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.current?.set(
      boardConfig(fen, orientation, lastMove, shapes, dests, movableColor, (from, to) => {
        moveRef.current?.(from, to);
      }),
    );
  }, [fen, orientation, last, lastMove, shapeKey, shapes, destKey, dests, movableColor]);

  return (
    <div className="w-full max-w-[min(100%,560px)] border-2 border-ink bg-board">
      <div ref={host} className="aspect-square w-full" />
    </div>
  );
}

function boardConfig(
  fen: string,
  orientation: Color,
  lastMove: { from: Square; to: Square } | null | undefined,
  shapes: BoardShape[],
  dests?: Record<string, string[]>,
  movableColor?: Color,
  onMove?: (from: Square, to: Square) => void,
) {
  const turn = sideToMove(fen) ?? 'white';
  const playable = Boolean(movableColor && onMove);
  const resolvedDests = playable ? destsForBoard(fen, dests) : undefined;
  return {
    fen,
    orientation,
    turnColor: turn,
    viewOnly: !playable,
    coordinates: true,
    disableContextMenu: true,
    blockTouchScroll: true,
    lastMove: lastMove ? [lastMove.from, lastMove.to] : [],
    highlight: { lastMove: true, check: true },
    animation: { enabled: true, duration: 160 },
    draggable: { enabled: playable },
    selectable: { enabled: playable },
    movable: playable
      ? {
          color: movableColor ?? turn,
          dests: toDests(resolvedDests ?? {}),
          showDests: true,
          events: {
            after(orig: string, dest: string) {
              if (isSq(orig) && isSq(dest)) onMove?.(orig, dest);
            },
          },
        }
      : { color: undefined, dests: new Map(), showDests: false },
    drawable: {
      enabled: false,
      visible: true,
      autoShapes: shapes.map((shape) => ({
        orig: shape.from,
        dest: shape.to,
        brush: shape.brush,
      })),
    },
  };
}

function destsForBoard(fen: string, dests?: Record<string, string[]>) {
  if (dests && Object.keys(dests).length > 0) return dests;
  const computed: Record<string, string[]> = {};
  for (const [from, tos] of Object.entries(legalDests(fen))) {
    if (tos && tos.length > 0) computed[from] = tos;
  }
  return computed;
}

function toDests(dests: Record<string, string[]>) {
  return new Map(Object.entries(dests) as Array<[Square, Square[]]>);
}

function isSq(value: string): value is Square {
  return value.length === 2;
}
