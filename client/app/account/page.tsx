'use client';

import Link from 'next/link';
import { TRAINING_FOCUS_LABELS } from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { PageIntro } from '@/components/dashboard/page-intro';
import * as Button from '@/components/ui/button';

export default function AccountPage() {
  return (
    <DashboardGate>
      {(user) => {
        const focus = user.onboarding.trainingFocus;
        return (
          <AppShell user={user}>
            <DashboardWell>
              <PageIntro folio="Account" title="Your account.">
                The name, sites, and clocks I use when I coach you.
              </PageIntro>

              <section className="divide-y-2 divide-ink border-2 border-t-4 border-ink border-t-cyan bg-bg-white-0 shadow-regular-xs [&>*]:odd:bg-bg-white-0 [&>*]:even:bg-bg-weak-50">
                <Row label="Name" value={user.displayName} />
                <Row label="Email" value={user.email ?? 'Not on this sign-in'} />
                <Row
                  label="Focus"
                  value={focus ? TRAINING_FOCUS_LABELS[focus] : 'Not set'}
                />
                <Row
                  label="Note"
                  value={user.onboarding.focusNote?.trim() || 'None'}
                />
                <Row
                  label="Time controls"
                  value={
                    user.onboarding.timeControls.length > 0
                      ? user.onboarding.timeControls.join(', ')
                      : 'None'
                  }
                />
                <div className="grid gap-1 px-4 py-3 md:grid-cols-[8rem_1fr] md:items-baseline">
                  <span className="font-mono text-sm font-medium text-text-strong-950">
                    Platforms
                  </span>
                  <ul className="flex flex-col gap-1 text-sm">
                    {user.accounts.length === 0 ? <li>None linked</li> : null}
                    {user.accounts.map((account) => (
                      <li key={account.provider}>
                        <span className="font-display font-bold">{labelFor(account.provider)}</span>
                        {account.username ? (
                          <span className="text-text-sub-600"> · {account.username}</span>
                        ) : null}
                      </li>
                    ))}
                    {!user.gameSources.includes('chesscom') ? (
                      <li>
                        <Link
                          href="/connect/chesscom"
                          className="font-display text-sm font-bold text-primary-base underline decoration-2 underline-offset-4"
                        >
                          Also connect Chess.com
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </section>

              <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
                <Link href="/billing">See plans</Link>
              </Button.Root>
            </DashboardWell>
          </AppShell>
        );
      }}
    </DashboardGate>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-4 py-3 md:grid-cols-[8rem_1fr] md:items-baseline">
      <span className="font-mono text-sm font-medium text-text-strong-950">{label}</span>
      <span className="text-sm leading-6">{value}</span>
    </div>
  );
}

function labelFor(provider: string) {
  if (provider === 'lichess') return 'Lichess';
  if (provider === 'chesscom') return 'Chess.com';
  if (provider === 'google') return 'Google';
  return provider;
}
