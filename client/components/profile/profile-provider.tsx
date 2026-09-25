'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { PublicCoachProfile, PublicUser, PublicWriteup } from '@peakelo/shared';

import { showError } from '@/components/ui/toast';
import { isEnginePassActive } from '@/lib/engine-pass';
import { queueWriteup, trainingErrorMessage } from '@/lib/training';
import { useCoachProfile } from '@/components/profile/use-coach-profile';

type ProfileContextValue = {
  user: PublicUser;
  snapshot: PublicCoachProfile | null | undefined;
  busy: boolean;
  generate: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ user, children }: { user: PublicUser; children: ReactNode }) {
  const [snapshot, setSnapshot] = useCoachProfile(user.enginePass.status);
  const [busy, setBusy] = useState(false);

  function generate() {
    setBusy(true);
    void queueWriteup()
      .then((next: PublicWriteup) => {
        setSnapshot((current) => (current ? { ...current, writeup: next } : current));
      })
      .catch((err: unknown) => showError(trainingErrorMessage(err)))
      .finally(() => setBusy(false));
  }

  return (
    <ProfileContext.Provider value={{ user, snapshot, busy, generate }}>{children}</ProfileContext.Provider>
  );
}

export function useProfileDesk() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfileDesk must be used under ProfileProvider');
  return value;
}

export function useProfilePass() {
  const { user } = useProfileDesk();
  return {
    pass: user.enginePass,
    active: isEnginePassActive(user.enginePass.status),
  };
}
