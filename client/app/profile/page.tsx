'use client';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
import { PlannedList } from '@/components/dashboard/planned-list';

export default function ProfilePage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <DashboardWell>
            <PageIntro folio="Profile" title="Who you are.">
              The living coach document. Every claim will be tied to your own games, in the same
              voice as the sample writeups.
            </PageIntro>
            <EmptyPlate folio="Plate 00" title="No profile yet.">
              No profile until every imported move has been through the engine. A type guessed from
              your first moves would be a costume.
            </EmptyPlate>
            <PlannedList
              adr="docs/adr/0004-player-profile.md"
              items={[
                {
                  title: 'Headline',
                  detail: 'Player type in words, time-control scoped. Anchor #headline.',
                },
                {
                  title: 'How games are decided',
                  detail: 'Mechanisms — hangs, time, conversion — not a results widget. #deciders.',
                },
                {
                  title: 'Clock',
                  detail: 'Flagger vs rusher vs dying in the last twenty seconds. #clock.',
                },
                {
                  title: 'Recurring mistakes',
                  detail: 'Named patterns, each citing 2–5 of your games. #mistakes.',
                },
                {
                  title: 'Structures and lines',
                  detail: 'Struggle by accuracy in the line, not win/loss. #structures.',
                },
                {
                  title: 'Tactics',
                  detail: 'Including 3–4 move combinations you miss and the ones you already see. #tactics.',
                },
                {
                  title: 'Keep these',
                  detail: 'Strengths the roadmap must not “fix.” #keep.',
                },
                {
                  title: 'Three things now',
                  detail: 'Links to roadmap steps or cited games. #now.',
                },
              ]}
            />
          </DashboardWell>
        </AppShell>
      )}
    </DashboardGate>
  );
}
