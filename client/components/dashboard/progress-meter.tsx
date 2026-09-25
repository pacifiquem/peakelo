import { cn } from '@/utils/cn';

export function ProgressMeter({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label: string;
}) {
  const safeTotal = Math.max(total, 0);
  const safeDone = Math.min(Math.max(done, 0), safeTotal);
  const pct = safeTotal === 0 ? 0 : Math.round((safeDone / safeTotal) * 100);
  const complete = safeTotal > 0 && safeDone >= safeTotal;

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-sm text-text-strong-950">
        {safeDone}/{safeTotal} {label}
        {complete ? ' · cleared' : ''}
      </p>
      <div
        className="h-3 w-full overflow-hidden border-2 border-ink bg-bg-weak-50"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${safeDone} of ${safeTotal} ${label}`}
      >
        <div
          className={cn('h-full', complete ? 'bg-gold' : 'bg-primary-base')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
