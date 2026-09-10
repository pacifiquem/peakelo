import { formatEvalScore, whiteEvalShare, type Color } from '@peakelo/engine';
import type { EvalScore } from '@peakelo/shared';

import { cn } from '@/utils/cn';

export function EvalBar({
  score,
  orientation,
}: {
  score: EvalScore;
  orientation: Color;
}) {
  const whiteShare = whiteEvalShare(score);
  const label = formatEvalScore(score);
  const whiteAhead = score.kind === 'mate' ? score.value > 0 : score.value > 0;
  const whiteOnBottom = orientation === 'white';

  return (
    <div
      className="relative flex w-8 shrink-0 flex-col self-stretch overflow-hidden border-2 border-ink"
      role="meter"
      aria-label={`Evaluation ${label}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(whiteShare * 100)}
      aria-valuetext={label}
    >
      {whiteOnBottom ? (
        <>
          <div className="bg-ink" style={{ flex: 1 - whiteShare }} />
          <div className="bg-bg-white-0" style={{ flex: whiteShare }} />
        </>
      ) : (
        <>
          <div className="bg-bg-white-0" style={{ flex: whiteShare }} />
          <div className="bg-ink" style={{ flex: 1 - whiteShare }} />
        </>
      )}
      <span
        className={cn(
          'pointer-events-none absolute inset-x-0 px-0.5 text-center font-mono text-[10px] font-bold leading-none',
          whiteAhead === whiteOnBottom ? 'bottom-1' : 'top-1',
          whiteAhead ? 'text-ink' : 'text-bg-white-0',
        )}
      >
        {label}
      </span>
    </div>
  );
}
