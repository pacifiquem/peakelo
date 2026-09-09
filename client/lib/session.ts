'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PublicUser } from '@peakelo/shared';
import { api } from './api';

export function useMe() {
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

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

  return { user, error, refresh, setUser };
}
