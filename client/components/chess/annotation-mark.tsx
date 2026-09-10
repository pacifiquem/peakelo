import type { MoveAnnotation } from '@peakelo/engine';

import { ANNOTATION_ICON, ANNOTATION_LABEL } from '@/lib/move-annotation';
import { cn } from '@/utils/cn';

export function AnnotationMark({
  note,
  inverted = false,
  withLabel = false,
}: {
  note: MoveAnnotation;
  inverted?: boolean;
  withLabel?: boolean;
}) {
  const Icon = ANNOTATION_ICON[note];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 align-middle',
        inverted ? 'text-text-white-0' : 'text-text-strong-950',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className={withLabel ? 'font-mono text-sm' : 'sr-only'}>{ANNOTATION_LABEL[note]}</span>
    </span>
  );
}
