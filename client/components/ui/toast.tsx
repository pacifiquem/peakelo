'use client';

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset={20}
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'w-full',
        },
      }}
    />
  );
}

export function showError(message: string) {
  sonnerToast.custom(
    (id) => (
      <ToastCard id={id} role="alert">
        {message}
      </ToastCard>
    ),
    { id: `error:${message}`, duration: 6000 },
  );
}

export function showInfo(message: string) {
  sonnerToast.custom(
    (id) => (
      <ToastCard id={id} role="status">
        {message}
      </ToastCard>
    ),
    { id: `info:${message}`, duration: 7000 },
  );
}

function ToastCard({
  id,
  role,
  children,
}: {
  id: string | number;
  role: 'alert' | 'status';
  children: string;
}) {
  return (
    <div
      role={role}
      className="w-[min(28rem,calc(100vw-2rem))] border-2 border-ink bg-bg-white-0 px-4 py-3 text-sm text-text-strong-950 shadow-regular-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <p>{children}</p>
        <button
          type="button"
          className="cursor-pointer font-display text-sm font-bold"
          onClick={() => sonnerToast.dismiss(id)}
        >
          Close
        </button>
      </div>
    </div>
  );
}
