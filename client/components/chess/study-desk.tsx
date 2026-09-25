import type { ReactNode } from 'react';

import * as Button from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function StudyDesk({
  board,
  panel,
  pane,
  onPane,
  boardLabel = 'Board',
  panelLabel = 'Lesson',
}: {
  board: ReactNode;
  panel: ReactNode;
  pane: 'board' | 'panel';
  onPane: (pane: 'board' | 'panel') => void;
  boardLabel?: string;
  panelLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 lg:hidden" role="tablist" aria-label="Study panes">
        <Button.Root
          type="button"
          role="tab"
          aria-selected={pane === 'board'}
          size="small"
          variant={pane === 'board' ? 'primary' : 'neutral'}
          mode={pane === 'board' ? 'filled' : 'stroke'}
          className="w-fit"
          onClick={() => onPane('board')}
        >
          {boardLabel}
        </Button.Root>
        <Button.Root
          type="button"
          role="tab"
          aria-selected={pane === 'panel'}
          size="small"
          variant={pane === 'panel' ? 'primary' : 'neutral'}
          mode={pane === 'panel' ? 'filled' : 'stroke'}
          className="w-fit"
          onClick={() => onPane('panel')}
        >
          {panelLabel}
        </Button.Root>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,32rem)_minmax(20rem,1fr)]">
        <div
          className={cn(
            'min-w-0 flex-col gap-3 lg:sticky lg:top-16 lg:flex',
            pane === 'board' ? 'flex' : 'hidden lg:flex',
          )}
        >
          {board}
        </div>
        <div className={cn('min-w-0', pane === 'panel' ? 'block' : 'hidden lg:block')}>{panel}</div>
      </div>
    </div>
  );
}
