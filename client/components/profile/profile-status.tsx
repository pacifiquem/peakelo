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
      <EmptyPlate folio="Profile" title="Reading your games">
        <p>Every imported move goes through the engine. I’ll write you up when that’s finished.</p>
        <EnginePassCounts pass={pass} className="mt-3" />
      </EmptyPlate>
    );
  }

  if (pass.status === 'failed') {
    return (
      <EmptyPlate folio="Profile" title="I couldn’t finish reading your games." tone="warning">
        {pass.error ?? 'The read stopped before I could write you up.'}
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
      <EmptyPlate folio="Profile" title="I couldn’t open your profile.">
        The games are read, but this page couldn’t load the writeup. Try again in a moment.
      </EmptyPlate>
    );
  }

  if (pass.status === 'ready' && snapshot?.profile) {
    return ready({ ...snapshot, profile: snapshot.profile });
  }

  return (
    <EmptyPlate folio="Profile" title="No profile yet.">
      I won’t guess what kind of player you are from a handful of moves. This shows up after I’ve
      read every imported game.
    </EmptyPlate>
  );
}
