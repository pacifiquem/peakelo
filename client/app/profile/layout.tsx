'use client';

import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { ProfileProvider } from '@/components/profile/profile-provider';

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <ProfileProvider user={user}>{children}</ProfileProvider>
        </AppShell>
      )}
    </DashboardGate>
  );
}
