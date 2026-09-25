import type { ReactNode } from 'react';
import Link from 'next/link';
import { RiArrowRightSLine } from '@remixicon/react';

import { cn } from '@/utils/cn';

export type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('font-mono text-sm text-text-strong-950', className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <RiArrowRightSLine className="size-4 shrink-0 text-text-sub-600" aria-hidden />
              ) : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="underline decoration-2 underline-offset-4 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function DeskSwitch({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {children}
    </div>
  );
}
