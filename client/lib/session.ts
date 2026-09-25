'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EnginePassStatus, PublicUser } from '@peakelo/shared';

import { showError, showInfo } from '@/components/ui/toast';
import { api } from './api';
import { isEnginePassActive } from './engine-pass';

const PASS_POLL_MS = 4000;

export function useMe() {
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const previousPassStatus = useRef<EnginePassStatus | undefined>(undefined);

  const refresh = useCallback(async () => {
    const data = await api<{ user: PublicUser | null }>('/me');
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ user: PublicUser | null }>('/me')
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load session');
        setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const passStatus = user?.enginePass.status;
  const passActive = passStatus !== undefined && isEnginePassActive(passStatus);

  useEffect(() => {
    if (!passActive) return;
    let inFlight = false;
    const timer = window.setInterval(() => {
      if (inFlight) return;
      inFlight = true;
      void refresh()
        .catch(() => undefined)
        .finally(() => {
          inFlight = false;
        });
    }, PASS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [passActive, refresh]);

  useEffect(() => {
    if (!user) return;
    const previous = previousPassStatus.current;
    const next = user.enginePass.status;
    const wasActive = previous !== undefined && isEnginePassActive(previous);
    if (wasActive && next === 'ready') {
      showInfo('Your profile is ready.');
    }
    if (wasActive && next === 'failed') {
      showError(user.enginePass.error ?? 'I couldn’t finish reading your games.');
    }
    previousPassStatus.current = next;
  }, [user]);

  return { user, error, refresh, setUser };
}
