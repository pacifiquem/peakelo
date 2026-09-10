'use client';

import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
import { PlannedList } from '@/components/dashboard/planned-list';
import * as Button from '@/components/ui/button';

export default function DrillsPage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <DashboardWell>
            <PageIntro folio="Drills" title="Assigned work.">
              A practice queue from the roadmap — not Puzzle Storm, not a public mates-in-two
              bucket.
            </PageIntro>
            <EmptyPlate
              folio="Plate 00"
              title="No drill until the roadmap names a leak."
              action={
                <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
                  <Link href="/roadmap">Open the syllabus</Link>
                </Button.Root>
              }
            >
              We will not serve random puzzles and call them yours. When a step exists, it will
              land here grouped by type.
            </EmptyPlate>
            <PlannedList
              adr="docs/adr/0006-roadmap-and-drills.md"
              items={[
                {
                  title: 'Queue',
                  detail: 'Group by roadmap step or type. Stem, source game, last attempt.',
                },
                {
                  title: 'Filters',
                  detail: 'Type, due, done.',
                },
                {
                  title: 'Open a drill',
                  detail: '/drills/[id] — one position, one job. No board until the FEN is yours.',
                },
              ]}
            />
          </DashboardWell>
        </AppShell>
      )}
    </DashboardGate>
  );
}
