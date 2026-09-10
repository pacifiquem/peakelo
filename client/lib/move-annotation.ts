import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiProhibitedFill,
  RiSparkling2Fill,
  RiThumbUpFill,
} from '@remixicon/react';
import type { MoveAnnotation } from '@peakelo/engine';

type Icon = typeof RiCheckboxCircleFill;

export const ANNOTATION_LABEL: Record<MoveAnnotation, string> = {
  brilliant: 'Brilliant',
  best: 'Best',
  good: 'Good',
  inaccuracy: 'Inaccuracy',
  miss: 'Miss',
  mistake: 'Mistake',
  blunder: 'Blunder',
};

export const ANNOTATION_ICON: Record<MoveAnnotation, Icon> = {
  brilliant: RiSparkling2Fill,
  best: RiCheckboxCircleFill,
  good: RiThumbUpFill,
  inaccuracy: RiErrorWarningFill,
  miss: RiProhibitedFill,
  mistake: RiAlertFill,
  blunder: RiCloseCircleFill,
};

export function annotationBrush(annotation: MoveAnnotation): string {
  if (annotation === 'blunder' || annotation === 'mistake') return 'paleRed';
  if (annotation === 'inaccuracy' || annotation === 'miss') return 'yellow';
  if (annotation === 'brilliant') return 'paleBlue';
  return 'paleGreen';
}
