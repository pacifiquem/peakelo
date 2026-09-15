'use client';

import { useEffect, useState } from 'react';
import type { PublicCoachProfile, PublicUser } from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { EnginePassCounts } from '@/components/dashboard/engine-pass-banner';
import { PageIntro } from '@/components/dashboard/page-intro';
import { SnapshotDesk } from '@/components/profile/snapshot-desk';
import { WriteupDesk } from '@/components/profile/writeup-desk';
import { showError } from '@/components/ui/toast';
import { isEnginePassActive } from '@/lib/engine-pass';
import { fetchCoachProfile, queueWriteup, trainingErrorMessage } from '@/lib/training';

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
  const [snapshot, setSnapshot] = useState<PublicCoachProfile | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const pass = user.enginePass;
  const active = isEnginePassActive(pass.status);

  useEffect(() => {
    let cancelled = false;
    fetchCoachProfile()
      .then((data) => {
        if (!cancelled) setSnapshot(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        showError(trainingErrorMessage(err));
        setSnapshot(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pass.status]);

  const writeupStatus = snapshot?.writeup.status;
  useEffect(() => {
    if (writeupStatus !== 'queued' && writeupStatus !== 'running') return;
    const timer = window.setInterval(() => {
      void fetchCoachProfile()
        .then(setSnapshot)
        .catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [writeupStatus]);

  const profile = snapshot?.profile ?? null;
  const writeup = snapshot?.writeup;
  const intro = active
    ? 'The engine is still reading every imported move. The writeup comes later.'
    : writeup?.document
      ? 'Every claim is tied to your games. The snapshot underneath is the raw counts.'
      : profile
        ? 'Raw counts from the engine pass. The coach document is the voice — write it when you are ready.'
        : 'The living coach document. Every claim will be tied to your own games, in the same voice as the sample writeups.';

  return (
    <DashboardWell>
      <PageIntro folio="Profile" title="Who you are.">
        {intro}
      </PageIntro>
      <ProfileBody
        pass={pass}
        snapshot={snapshot}
        profile={profile}
        active={active}
        busy={busy}
        onGenerate={() => {
          setBusy(true);
          void queueWriteup()
            .then((next) => {
              setSnapshot((current) => (current ? { ...current, writeup: next } : current));
            })
            .catch((err: unknown) => showError(trainingErrorMessage(err)))
            .finally(() => setBusy(false));
        }}
      />
    </DashboardWell>
  );
}

function ProfileBody({
  pass,
  snapshot,
  profile,
  active,
  busy,
  onGenerate,
}: {
  pass: PublicUser['enginePass'];
  snapshot: PublicCoachProfile | null | undefined;
  profile: PublicCoachProfile['profile'];
  active: boolean;
  busy: boolean;
  onGenerate: () => void;
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
    return (
      <div className="flex flex-col gap-10">
        <WriteupDesk writeup={snapshot!.writeup} onGenerate={onGenerate} busy={busy} />
        <SnapshotDesk profile={profile} />
      </div>
    );
  }

  return (
    <EmptyPlate folio="Plate 00" title="No profile yet.">
      No profile until every imported move has been through the engine. A type guessed from your
      first moves would be a costume.
    </EmptyPlate>
  );
}