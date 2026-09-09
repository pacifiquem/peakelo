import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

export function Banner({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error';
  children: ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'border-2 border-ink px-4 py-3 text-sm shadow-regular-xs',
        tone === 'error' ? 'bg-[#fde8eb] text-error-base' : 'bg-bg-white-0 text-text-strong-950',
      )}
    >
      {children}
    </div>
  );
}
