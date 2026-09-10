'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicUser } from '@peakelo/shared';

import { showError } from '@/components/ui/toast';
import { useMe } from '@/lib/session';

export function DashboardGate({ children }: { children: (user: PublicUser) => ReactNode }) {
  const router = useRouter();
  const { user, error } = useMe();

  useEffect(() => {
    if (user === null) router.replace('/join');
    if (user && !user.onboarding.completed) router.replace('/onboarding');
  }, [user, router]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  if (user === undefined) {
    return <main className="px-6 py-16 text-text-sub-600">Loading the desk…</main>;
  }
  if (!user || !user.onboarding.completed) return null;
  return <>{children(user)}</>;
}
