'use client';

import { useEffect, useState } from 'react';
import type { PublicProfile, PublicUser } from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { EnginePassCounts } from '@/components/dashboard/engine-pass-banner';
import { PageIntro } from '@/components/dashboard/page-intro';
import { SnapshotDesk } from '@/components/profile/snapshot-desk';
import { showError } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { isEnginePassActive } from '@/lib/engine-pass';

export default function ProfilePage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <ProfileDesk user={user} />
        </AppShell>
      )}
    </DashboardGate>
  );
}

function ProfileDesk({ user }: { user: PublicUser }) {
  const [snapshot, setSnapshot] = useState<PublicProfile | null | undefined>(undefined);
  const pass = user.enginePass;
  const active = isEnginePassActive(pass.status);

  useEffect(() => {
    let cancelled = false;
    api<PublicProfile>('/profile')
      .then((data) => {
        if (!cancelled) setSnapshot(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        showError(err instanceof Error ? err.message : 'Could not load the profile');
        setSnapshot(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pass.status]);

  const profile = snapshot?.profile ?? null;
  const intro = active
    ? 'The engine is still reading every imported move. The writeup comes later.'
    : profile
      ? 'Raw counts from the engine pass. Every row is from your games. The writeup is not written yet.'
      : 'The living coach document. Every claim will be tied to your own games, in the same voice as the sample writeups.';

  return (
    <DashboardWell>
      <PageIntro folio="Profile" title="Who you are.">
        {intro}
      </PageIntro>
      <ProfileBody pass={pass} snapshot={snapshot} profile={profile} active={active} />
    </DashboardWell>
  );
}

function ProfileBody({
  pass,
  snapshot,
  profile,
  active,
}: {
  pass: PublicUser['enginePass'];
  snapshot: PublicProfile | null | undefined;
  profile: PublicProfile['profile'];
  active: boolean;
}) {
  if (active) {
    return (
      <EmptyPlate folio="Engine pass" title="Building your profile">
        <p>
          Every imported move goes through the engine. This stays on the desk until it finishes.
        </p>
        <EnginePassCounts pass={pass} className="mt-3" />
        <p className="mt-3 text-sm text-text-sub-600">
          The writeup comes later. This pass is counts and citations.
        </p>
      </EmptyPlate>
    );
  }

  if (pass.status === 'failed') {
    return (
      <EmptyPlate folio="Engine pass" title="The engine pass failed." tone="warning">
        {pass.error ?? 'The snapshot did not finish.'}
      </EmptyPlate>
    );
  }

  const waitingOnReadySnapshot =
    pass.status === 'ready' && snapshot != null && snapshot.pass.status !== 'ready';

  if (snapshot === undefined || waitingOnReadySnapshot) {
    return <p className="text-text-sub-600">Loading the snapshot…</p>;
  }

  if (pass.status === 'ready' && snapshot === null) {
    return (
      <EmptyPlate folio="Profile" title="Could not load the snapshot.">
        The pass is marked ready, but this desk could not read it.
      </EmptyPlate>
    );
  }

  if (pass.status === 'ready' && profile) {
    return <SnapshotDesk profile={profile} />;
  }

  return (
    <EmptyPlate folio="Plate 00" title="No profile yet.">
      No profile until every imported move has been through the engine. A type guessed from your
      first moves would be a costume.
    </EmptyPlate>
  );
}