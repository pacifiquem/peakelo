import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

export function DashboardWell({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'wide' | 'study';
}) {
  return (
    <main
      className={cn(
        'mx-auto w-full',
        size === 'study' ? 'max-w-[88rem] px-3 py-4 lg:px-6' : 'px-4 py-8 lg:px-8',
        size === 'default' && 'max-w-5xl',
        size === 'wide' && 'max-w-7xl',
        className,
      )}
    >
      <div className="peakelo-scan" aria-hidden />
      <div
        className={cn(
          'mt-4 flex flex-col bg-paper',
          size === 'study' ? 'gap-4' : 'gap-8 border-2 border-ink p-4 shadow-regular-sm md:p-8',
        )}
      >
        {children}
      </div>
    </main>
  );
}
