'use client';

import { useEffect, useState } from 'react';
import type { EnginePassStatus, PublicCoachProfile } from '@peakelo/shared';

import { showError } from '@/components/ui/toast';
import { fetchCoachProfile, trainingErrorMessage } from '@/lib/training';

export function useCoachProfile(passStatus: EnginePassStatus) {
  const [snapshot, setSnapshot] = useState<PublicCoachProfile | null | undefined>(undefined);

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
  }, [passStatus]);

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

  return [snapshot, setSnapshot] as const;
}
