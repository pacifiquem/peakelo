import type { ReactNode } from 'react';
import type { PublicCoachProfile, PublicUser } from '@peakelo/shared';

import { EmptyPlate } from '@/components/dashboard/empty-plate';
import { EnginePassCounts } from '@/components/dashboard/engine-pass-banner';

export type ReadyCoachProfile = PublicCoachProfile & {
  profile: NonNullable<PublicCoachProfile['profile']>;
};

export function ProfileStatus({
  pass,
  snapshot,
  active,
  ready,
}: {
  pass: PublicUser['enginePass'];
  snapshot: PublicCoachProfile | null | undefined;
  active: boolean;
  ready: (snapshot: ReadyCoachProfile) => ReactNode;
}) {
  if (active) {
    return (
      <EmptyPlate folio="Engine pass" title="Building your profile">
        <p>Every imported move goes through the engine. This stays on the desk until it finishes.</p>
        <EnginePassCounts pass={pass} className="mt-3" />
        <p className="mt-3 text-sm text-text-sub-600">The coach document comes after this pass.</p>
      </EmptyPlate>
    );
  }

  if (pass.status === 'failed') {
    return (
      <EmptyPlate folio="Engine pass" title="The engine pass failed." tone="warning">
        {pass.error ?? 'The engine pass did not finish.'}
      </EmptyPlate>
    );
  }

  const waitingOnReadySnapshot =
    pass.status === 'ready' && snapshot != null && snapshot.pass.status !== 'ready';

  if (snapshot === undefined || waitingOnReadySnapshot) {
    return <p className="text-text-sub-600">Loading the profile…</p>;
  }

  if (pass.status === 'ready' && snapshot === null) {
    return (
      <EmptyPlate folio="Profile" title="Could not load the profile.">
        The pass is marked ready, but this desk could not read it.
      </EmptyPlate>
    );
  }

  if (pass.status === 'ready' && snapshot?.profile) {
    return ready({ ...snapshot, profile: snapshot.profile });
  }

  return (
    <EmptyPlate folio="Plate 00" title="No profile yet.">
      No profile until every imported move has been through the engine. A type guessed from your
      first moves would be a costume.
    </EmptyPlate>
  );
}
