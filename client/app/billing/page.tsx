'use client';

import {
  ANALYSIS_MONTHLY_USD,
  SINGLE_GAME_ANALYSIS_USD,
  TRAINING_MONTHLY_USD,
} from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { PageIntro } from '@/components/dashboard/page-intro';
import { PlannedList } from '@/components/dashboard/planned-list';

const PLANS = [
  {
    name: 'Analysis',
    price: `$${ANALYSIS_MONTHLY_USD.toFixed(2)} / month`,
    unlocks: 'Profile writeup and a lesson for every imported game.',
  },
  {
    name: 'Training',
    price: `$${TRAINING_MONTHLY_USD.toFixed(2)} / month`,
    unlocks: 'Analysis, plus the syllabus and assigned drills.',
  },
  {
    name: 'One game',
    price: `$${SINGLE_GAME_ANALYSIS_USD.toFixed(2)}`,
    unlocks: 'A single game writeup. No profile. No syllabus.',
  },
];

export default function BillingPage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <DashboardWell>
            <PageIntro folio="Billing" title="Three prices.">
              Analysis, Training, or one game. Nothing else until we pick a processor.
            </PageIntro>

            <section className="divide-y-2 divide-ink border-2 border-ink bg-bg-white-0 shadow-regular-sm">
              {PLANS.map((plan) => (
                <article
                  key={plan.name}
                  className="grid gap-1 px-4 py-4 odd:bg-bg-white-0 even:bg-bg-weak-50 md:grid-cols-[8rem_8rem_1fr]"
                >
                  <h2 className="font-display font-bold">{plan.name}</h2>
                  <p className="font-mono text-sm">{plan.price}</p>
                  <p className="text-sm leading-6 text-text-strong-950">{plan.unlocks}</p>
                </article>
              ))}
            </section>

            <EmptyPlate tone="warning" folio="Checkout" title="Checkout is not wired.">
              We will not pretend a card was charged. When a processor is chosen, this plate
              becomes the form — not a fake “Active, renews next month.”
            </EmptyPlate>

            <PlannedList
              adr="docs/adr/0007-account-and-billing.md"
              items={[
                {
                  title: 'Current plan',
                  detail: 'Analysis, Training, or none. Query ?intent=analysis|training|game.',
                },
                {
                  title: 'One-game unlock',
                  detail: 'From /games/[id] when the writeup is locked. $1.22.',
                },
                {
                  title: 'Manage payment',
                  detail: 'Invoices after a processor exists. Stop and ask before adding one.',
                },
              ]}
            />
          </DashboardWell>
        </AppShell>
      )}
    </DashboardGate>
  );
}
