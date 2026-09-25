'use client';

import { useCallback, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useDeskQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const replace = useCallback(
    (patch: Record<string, string | null>, resetPage = false) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      if (resetPage) next.delete('page');
      const suffix = next.size > 0 ? `?${next.toString()}` : '';
      router.replace(`${pathname}${suffix}`, { scroll: false });
    },
    [params, pathname, router],
  );

  return { params, replace };
}

export function useSectionParam(valid: readonly string[], fallback: string) {
  const { params, replace } = useDeskQuery();
  const raw = params.get('section') ?? fallback;
  const section = valid.includes(raw) ? raw : fallback;

  const setSection = useCallback(
    (next: string) => {
      replace({ section: next === fallback ? null : next });
    },
    [fallback, replace],
  );

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash || !valid.includes(hash) || hash === section) return;
    setSection(hash);
  }, [section, setSection, valid]);

  return [section, setSection] as const;
}
