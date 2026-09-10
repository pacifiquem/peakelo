'use client';

import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
import { PlannedList } from '@/components/dashboard/planned-list';
import * as Button from '@/components/ui/button';

export default function RoadmapPage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <DashboardWell>
            <PageIntro folio="Roadmap" title="The syllabus.">
              A workbook table of contents from your profile toward the next band — not a generic
              tactics book and not a cartoon trail.
            </PageIntro>
            <EmptyPlate
              folio="Plate 00"
              title="No syllabus yet."
              action={
                <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
                  <Link href="/billing?intent=training">Training is $34.99 / month</Link>
                </Button.Root>
              }
            >
              A roadmap without a profile is a generic tactics book. Wait for the writeup. The
              syllabus and drills are Training; profile and game writeups stay on Analysis.
            </EmptyPlate>
            <PlannedList
              adr="docs/adr/0006-roadmap-and-drills.md"
              items={[
                {
                  title: 'Blunder-preventer',
                  detail: 'Highest-leverage habit from the sample writeups. Behavioral done-when.',
                },
                {
                  title: 'Replay own mistakes',
                  detail: 'Positions from your games, not textbook mates.',
                },
                {
                  title: 'Defend worse',
                  detail: 'Stubborn defense taken from your own lost or worse positions.',
                },
                {
                  title: 'Convert advantage',
                  detail: 'The wins you dumped — Game 9 / Game 12 style counting and progress.',
                },
                {
                  title: 'Make a plan',
                  detail: 'Intermediate+. Quiet structures where you shuffle instead of breaking.',
                },
              ]}
            />
          </DashboardWell>
        </AppShell>
      )}
    </DashboardGate>
  );
}
