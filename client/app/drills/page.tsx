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
              <span className="size-2 bg-magenta" aria-hidden />
              <h1 className="font-display text-3xl font-extrabold md:text-4xl">Your drills.</h1>
              <span className="h-1 w-16 bg-gold" aria-hidden />
              <p className="max-w-[62ch] text-lg leading-7 text-text-strong-950">
                Each card is one habit from your games. Open it, then replay the moment.
              </p>
            </header>
            <KindIndex />
          </DashboardWell>
        </AppShell>
      )}
    </DashboardGate>
  );
}
