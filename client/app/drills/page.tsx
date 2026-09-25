'use client';

import { AppShell } from '@/components/app-shell';
import { Breadcrumb } from '@/components/dashboard/breadcrumb';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { KindIndex } from '@/components/drills/kind-index';

export default function DrillsPage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <DashboardWell>
            <Breadcrumb items={[{ label: 'Drills' }]} />
            <header className="flex flex-col gap-2">
              <h1 className="font-display text-3xl font-extrabold md:text-4xl">Your drills.</h1>
              <span className="h-1 w-16 bg-gold" aria-hidden />
            </header>
            <KindIndex />
          </DashboardWell>
        </AppShell>
      )}
    </DashboardGate>
  );
}
