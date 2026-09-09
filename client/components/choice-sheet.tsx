import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { RiCheckLine } from '@remixicon/react';

import { cn } from '@/utils/cn';

export function ChoiceSheet({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'divide-y-2 divide-ink overflow-hidden border-2 border-ink bg-bg-white-0 shadow-regular-sm',
        className,
      )}
      {...rest}
    />
  );
}

export function ChoiceHeader({ children }: { children: ReactNode }) {
  return (
    <div className="bg-bg-weak-50 px-4 py-2 font-display text-sm font-bold text-text-strong-950">
      {children}
    </div>
  );
}

export function ChoiceMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-5 shrink-0 items-center justify-center border-2 border-ink',
        on ? 'bg-primary-base' : 'bg-bg-white-0',
      )}
    >
      {on ? <RiCheckLine className="size-3.5 text-text-white-0" /> : null}
    </span>
  );
}

const rowClass = ({ selected, disabled }: { selected?: boolean; disabled?: boolean }) =>
  cn(
    'flex w-full items-center gap-3 px-4 py-3 text-left',
    'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
    selected ? 'bg-primary-alpha-10' : 'bg-bg-white-0',
    !disabled && 'cursor-pointer hover:bg-bg-weak-50',
    disabled &&
      'cursor-not-allowed bg-bg-soft-200 text-text-sub-600 hover:bg-bg-soft-200',
  );

export function ChoiceRow({
  selected,
  className,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  const pressed = rest.role === 'radio' ? undefined : selected;
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      className={cn(rowClass({ selected, disabled }), className)}
      {...rest}
    />
  );
}

export function ChoiceLink({
  selected,
  className,
  ...rest
}: HTMLAttributes<HTMLAnchorElement> & { href: string; selected?: boolean }) {
  return <a className={cn(rowClass({ selected }), className)} {...rest} />;
}

export function SegmentCell({
  selected,
  className,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        'flex flex-col items-start gap-0.5 px-4 py-3 text-left',
        'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
        'border-ink [&:not(:first-child)]:border-l-2',
        selected ? 'bg-primary-base text-text-white-0' : 'bg-bg-white-0 text-text-strong-950',
        !disabled && !selected && 'cursor-pointer hover:bg-bg-weak-50',
        !disabled && selected && 'cursor-pointer hover:bg-primary-dark',
        disabled &&
          'cursor-not-allowed bg-bg-soft-200 text-text-sub-600 hover:bg-bg-soft-200',
        className,
      )}
      {...rest}
    />
  );
}
