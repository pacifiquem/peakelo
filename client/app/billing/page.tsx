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

const PLANS = [
  {
    name: 'Analysis',
    price: `$${ANALYSIS_MONTHLY_USD.toFixed(2)} / month`,
    unlocks: 'Your profile writeup, and a lesson for every imported game.',
    accent: 'border-t-magenta',
  },
  {
    name: 'Training',
    price: `$${TRAINING_MONTHLY_USD.toFixed(2)} / month`,
    unlocks: 'Analysis, plus the roadmap and the drills from your games.',
    accent: 'border-t-gold',
  },
  {
    name: 'One game',
    price: `$${SINGLE_GAME_ANALYSIS_USD.toFixed(2)}`,
    unlocks: 'A writeup of one game. No profile, and no roadmap.',
    accent: 'border-t-cyan',
  },
];

export default function BillingPage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <DashboardWell>
            <PageIntro folio="Billing" title="Three prices.">
              Analysis, Training, or one game. Checkout isn&apos;t open yet — these are the real
              prices.
            </PageIntro>

            <section className="flex flex-col gap-3">
              {PLANS.map((plan) => (
                <article
                  key={plan.name}
                  className={`grid gap-1 border-2 border-t-4 border-ink bg-bg-white-0 px-4 py-4 shadow-regular-xs md:grid-cols-[8rem_8rem_1fr] ${plan.accent}`}
                >
                  <h2 className="font-display font-bold">{plan.name}</h2>
                  <p className="font-mono text-sm">{plan.price}</p>
                  <p className="text-sm leading-6 text-text-strong-950">{plan.unlocks}</p>
                </article>
              ))}
            </section>

            <EmptyPlate tone="warning" folio="Checkout" title="Checkout isn’t open yet.">
              You can see the prices. Nothing here will pretend a card was charged.
            </EmptyPlate>
          </DashboardWell>
        </AppShell>
      )}
    </DashboardGate>
  );
}
