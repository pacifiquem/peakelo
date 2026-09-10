'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  RiBankCardLine,
  RiFileList3Line,
  RiFocus3Line,
  RiHome5Line,
  RiRouteLine,
  RiSettings3Line,
  RiUser3Line,
} from '@remixicon/react';
import { gameSourcesFromAccounts, type GameSource, type PublicUser } from '@peakelo/shared';

import { ChesscomLogo, LichessLogo } from '@/components/brand/provider-logos';
import * as Button from '@/components/ui/button';
import { addSourceHref, api } from '@/lib/api';
import { cn } from '@/utils/cn';

const NAV = [
  { href: '/home', label: 'Home', icon: RiHome5Line },
  { href: '/profile', label: 'Profile', icon: RiUser3Line },
  { href: '/games', label: 'Games', icon: RiFileList3Line },
  { href: '/roadmap', label: 'Roadmap', icon: RiRouteLine },
  { href: '/drills', label: 'Drills', icon: RiFocus3Line },
] as const;

const SETTINGS = [
  { href: '/account', label: 'Account', icon: RiSettings3Line },
  { href: '/billing', label: 'Billing', icon: RiBankCardLine },
] as const;

export function AppShell({
  user,
  children,
  viewingSource,
  onViewingSource,
}: {
  user: PublicUser;
  children: ReactNode;
  viewingSource?: GameSource;
  onViewingSource?: (source: GameSource) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const sources = user.gameSources ?? gameSourcesFromAccounts(user.accounts);

  async function signOut() {
    await api('/auth/logout', { method: 'POST' });
    router.replace('/join');
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden border-ink bg-bg-white-0 md:flex md:w-14 md:shrink-0 md:flex-col md:border-r-2 lg:w-52">
        <Link
          href="/home"
          className="hidden h-14 items-center border-b-2 border-ink px-4 font-display text-lg font-extrabold lg:flex"
        >
          Peakelo
        </Link>
        <nav aria-label="Studio" className="flex flex-1 flex-col p-2">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <RailLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
          <div className="mt-auto border-t-2 border-ink pt-2 pb-8">
            <p className="hidden px-2 py-1 font-mono text-sm font-medium text-text-strong-950 lg:block">
              Settings
            </p>
            <div className="flex flex-col gap-1" role="group" aria-label="Settings">
              {SETTINGS.map((item) => (
                <RailLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-paper pb-24 md:pb-0">
        <header className="sticky top-0 z-30 border-b-2 border-ink bg-bg-white-0">
          <div className="flex min-h-14 flex-wrap items-center gap-3 px-4 py-2 lg:px-6">
            <Link href="/home" className="font-display text-lg font-extrabold lg:hidden">
              Peakelo
            </Link>
            <span className="hidden items-center gap-2 font-mono text-sm font-medium text-text-strong-950 sm:inline-flex">
              <span className="size-2 shrink-0 bg-primary-base" aria-hidden />
              {folioFor(pathname)}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {viewingSource && onViewingSource ? (
                <div className="flex items-center gap-1" role="group" aria-label="Game source">
                  {(['lichess', 'chesscom'] as const).map((source) => {
                    const linked = sources.includes(source);
                    const active = viewingSource === source;
                    const label = source === 'lichess' ? 'Lichess' : 'Chess.com';
                    const Logo = source === 'lichess' ? LichessLogo : ChesscomLogo;
                    if (!linked) {
                      return (
                        <Button.Root
                          key={source}
                          asChild
                          variant="neutral"
                          mode="ghost"
                          size="xsmall"
                        >
                          <Link href={addSourceHref(source)}>
                            <Logo className="size-4" />
                            Import {label}
                          </Link>
                        </Button.Root>
                      );
                    }
                    return (
                      <Button.Root
                        key={source}
                        type="button"
                        variant={active ? 'primary' : 'neutral'}
                        mode={active ? 'filled' : 'stroke'}
                        size="xsmall"
                        aria-pressed={active}
                        onClick={() => onViewingSource(source)}
                      >
                        <Logo className="size-4" />
                        {label}
                      </Button.Root>
                    );
                  })}
                </div>
              ) : null}
              <span className="hidden font-mono text-sm text-text-strong-950 sm:inline">
                {user.displayName}
              </span>
              <Button.Root
                type="button"
                variant="neutral"
                mode="stroke"
                size="xsmall"
                onClick={() => void signOut()}
              >
                Sign out
              </Button.Root>
            </div>
          </div>
        </header>
        {children}
      </div>

      <nav
        aria-label="Studio"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t-2 border-ink bg-bg-white-0 md:hidden"
      >
        {[...NAV, { href: '/account', label: 'Settings', icon: RiSettings3Line }].map((item) => {
          const active =
            item.href === '/account'
              ? pathname.startsWith('/account') || pathname.startsWith('/billing')
              : isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 font-mono text-[10px]',
                active ? 'bg-primary-alpha-10 text-primary-base' : 'text-text-sub-600',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function RailLink({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: typeof RiHome5Line };
  pathname: string;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 border-l-4 px-2 py-2 font-display text-sm font-bold',
        'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        active
          ? 'border-primary-base bg-primary-alpha-10'
          : 'border-transparent hover:bg-bg-weak-50',
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="hidden lg:inline">{item.label}</span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === '/home') return pathname === '/home';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function folioFor(pathname: string) {
  if (pathname.startsWith('/games/')) return 'Game lesson';
  if (pathname.startsWith('/drills/')) return 'Drill';
  if (pathname.startsWith('/games')) return 'Games';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/roadmap')) return 'Roadmap';
  if (pathname.startsWith('/drills')) return 'Drills';
  if (pathname.startsWith('/account')) return 'Account';
  if (pathname.startsWith('/billing')) return 'Billing';
  return 'Home';
}
