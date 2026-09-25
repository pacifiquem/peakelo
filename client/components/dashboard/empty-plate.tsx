import type { ReactNode } from 'react';
import { RiErrorWarningLine } from '@remixicon/react';

import { cn } from '@/utils/cn';

export function EmptyPlate({
  folio,
  title,
  children,
  action,
  className,
  tone = 'default',
}: {
  folio: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: 'default' | 'warning';
}) {
  const warning = tone === 'warning';
  return (
    <section
      role={warning ? 'status' : undefined}
      className={cn(
        'border-2 border-ink p-6 shadow-regular-sm md:p-8',
        warning
          ? 'border-l-8 border-l-gold bg-gold/25'
          : 'border-t-4 border-t-magenta bg-bg-white-0',
        className,
      )}
    >
      <p className="flex items-center gap-2 font-mono text-sm font-medium text-text-strong-950">
        {warning ? <RiErrorWarningLine className="size-4 shrink-0" aria-hidden /> : null}
        {folio}
      </p>
      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-normal md:text-3xl">
        {title}
      </h2>
      <div className="mt-3 max-w-[62ch] text-base leading-7 text-text-strong-950">{children}</div>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
