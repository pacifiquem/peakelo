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
              <h1 className="font-display text-3xl font-extrabold md:text-4xl">Assigned work.</h1>
              <p className="max-w-[62ch] text-lg leading-7 text-text-strong-950">
                One card per leak. Open a set to see the moments from your games, then replay a
                position.
              </p>
            </header>
            <KindIndex />
          </DashboardWell>
        </AppShell>
      )}
    </DashboardGate>
  );
}
