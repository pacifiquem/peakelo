import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

export function DashboardWell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'mx-auto flex w-full max-w-5xl flex-col gap-8 bg-paper px-4 py-8 lg:px-8',
        className,
      )}
    >
      {children}
    </main>
  );
}
