import type { ReactNode } from 'react';

export function PageIntro({
  folio,
  title,
  children,
}: {
  folio: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3">
      <p className="flex items-center gap-2 font-mono text-sm font-medium text-text-strong-950">
        <span className="size-2 shrink-0 bg-primary-base" aria-hidden />
        {folio}
      </p>
      <h1 className="font-display text-4xl font-extrabold tracking-normal">{title}</h1>
      <p className="max-w-[62ch] text-lg leading-7 text-text-strong-950">{children}</p>
    </header>
  );
}
