import {
  RiAlertFill,
  RiAwardFill,
  RiBookOpenFill,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiProhibitedFill,
  RiSparkling2Fill,
  RiStarFill,
  RiThumbUpFill,
} from '@remixicon/react';
import type { MoveAnnotation } from '@peakelo/engine';

type Icon = typeof RiCheckboxCircleFill;

export const ANNOTATION_LABEL: Record<MoveAnnotation, string> = {
  brilliant: 'Brilliant',
  great: 'Great',
  best: 'Best',
  excellent: 'Excellent',
  good: 'Good',
  book: 'Book',
  inaccuracy: 'Inaccuracy',
  miss: 'Miss',
  mistake: 'Mistake',
  blunder: 'Blunder',
};

export const ANNOTATION_ICON: Record<MoveAnnotation, Icon> = {
  brilliant: RiSparkling2Fill,
  great: RiStarFill,
  best: RiCheckboxCircleFill,
  excellent: RiAwardFill,
  good: RiThumbUpFill,
  book: RiBookOpenFill,
  inaccuracy: RiErrorWarningFill,
  miss: RiProhibitedFill,
  mistake: RiAlertFill,
  blunder: RiCloseCircleFill,
};

export function annotationBrush(annotation: MoveAnnotation): string {
  if (annotation === 'blunder' || annotation === 'mistake') return 'paleRed';
  if (annotation === 'inaccuracy' || annotation === 'miss') return 'yellow';
  if (annotation === 'brilliant' || annotation === 'great') return 'paleBlue';
  return 'paleGreen';
}
