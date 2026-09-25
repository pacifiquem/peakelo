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
        'mx-auto flex w-full flex-col bg-paper',
        size === 'study' ? 'max-w-[88rem] gap-4 px-3 py-4 lg:px-6' : 'gap-8 px-4 py-8 lg:px-8',
        size === 'default' && 'max-w-5xl',
        size === 'wide' && 'max-w-7xl',
        className,
      )}
    >
      {children}
    </main>
  );
}
