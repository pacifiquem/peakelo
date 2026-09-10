'use client';

import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
import { PlannedList } from '@/components/dashboard/planned-list';
import * as Button from '@/components/ui/button';

export default function DrillSessionPage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <DashboardWell>
            <PageIntro folio="Drill" title="One position, one job.">
              The student moves. The stem says why this is yours. There is no board until the
              position comes from a game we have actually tagged.
            </PageIntro>
            <EmptyPlate
              folio="Plate 00"
              title="This drill has no position yet."
              action={
                <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
                  <Link href="/drills">Back to the queue</Link>
                </Button.Root>
              }
            >
              We will not put a textbook mate in front of you and call it yours.
            </EmptyPlate>
            <PlannedList
              adr="docs/adr/0006-roadmap-and-drills.md"
              items={[
                {
                  title: 'Stem',
                  detail: 'Two or three sentences: why this position is yours.',
                },
                {
                  title: 'Board',
                  detail: 'You move. On a miss: the idea in words and the refutation arrow — not −2.4.',
                },
                {
                  title: 'After',
                  detail: 'Try again, see the game at the ply, next drill, back to the roadmap step.',
                },
                {
                  title: 'Types',
                  detail:
                    'Replay the mistake; defend worse; convert an advantage; what’s the plan; blunder-preventer.',
                },
              ]}
            />
          </DashboardWell>
        </AppShell>
      )}
    </DashboardGate>
  );
}
