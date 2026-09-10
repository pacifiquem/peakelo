'use client';

import { useEffect, useRef } from 'react';
import { Chessground } from '@lichess-org/chessground';
import type { Color, Square } from '@peakelo/engine';

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
}: {
  fen: string;
  orientation: Color;
  lastMove?: { from: Square; to: Square } | null;
  shapes?: BoardShape[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Ground | null>(null);
  const last = lastMove ? `${lastMove.from}${lastMove.to}` : '';
  const shapeKey = shapes.map((shape) => `${shape.from}${shape.to ?? ''}${shape.brush}`).join(',');

  useEffect(() => {
    if (!host.current) return;
    api.current = Chessground(host.current, boardConfig(fen, orientation, lastMove, shapes));
    return () => {
      api.current?.destroy();
      api.current = null;
    };
    // Mount once. Position updates go through set() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.current?.set(boardConfig(fen, orientation, lastMove, shapes));
  }, [fen, orientation, last, lastMove, shapeKey, shapes]);

  return (
    <div className="w-full max-w-[min(100%,560px)] border-2 border-ink bg-board">
      <div ref={host} className="aspect-square w-full" />
    </div>
  );
}

function boardConfig(
  fen: string,
  orientation: Color,
  lastMove?: { from: Square; to: Square } | null,
  shapes: BoardShape[] = [],
) {
  return {
    fen,
    orientation,
    viewOnly: true,
    coordinates: true,
    disableContextMenu: true,
    blockTouchScroll: true,
    lastMove: lastMove ? [lastMove.from, lastMove.to] : [],
    highlight: { lastMove: true, check: true },
    animation: { enabled: true, duration: 160 },
    draggable: { enabled: false },
    selectable: { enabled: false },
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
