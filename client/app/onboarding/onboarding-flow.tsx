'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ApiClientError,
  INITIAL_IMPORT_LIMIT,
  TRAINING_FOCUS_LABELS,
  type GameSource,
  type OnboardingState,
  type TimeControl,
  type TrainingFocus,
} from '@peakelo/shared';

import { AppChrome } from '@/components/app-chrome';
import { ChesscomLogo, LichessLogo } from '@/components/brand/provider-logos';
import {
  ChoiceHeader,
  ChoiceLink,
  ChoiceMark,
  ChoiceRow,
  ChoiceSheet,
  SegmentCell,
} from '@/components/choice-sheet';
import { ImportTicker } from '@/components/import-ticker';
import * as Button from '@/components/ui/button';
import * as Input from '@/components/ui/input';
import { showError } from '@/components/ui/toast';
import { api, oauthStartUrl } from '@/lib/api';
import { useMe } from '@/lib/session';
import { cn } from '@/utils/cn';

const FOCUS_OPTIONS = Object.entries(TRAINING_FOCUS_LABELS) as [TrainingFocus, string][];
const TIME_CONTROLS: { id: TimeControl; label: string; hint: string }[] = [
  { id: 'rapid', label: 'Rapid', hint: '10–60 min' },
  { id: 'blitz', label: 'Blitz', hint: '3–10 min' },
  { id: 'bullet', label: 'Bullet', hint: 'under 3 min' },
];

export function OnboardingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const oauthError = params.get('error');
  const { user, error, refresh } = useMe();
  const [busy, setBusy] = useState(false);
  const [focusOverride, setFocusOverride] = useState<TrainingFocus | '' | null>(null);
  const [note, setNote] = useState('');
  const [username, setUsername] = useState('');
  const [timeControlsOverride, setTimeControlsOverride] = useState<TimeControl[] | null>(null);
  const [selectedOverride, setSelectedOverride] = useState<GameSource[] | null>(null);

  useEffect(() => {
    if (user === null) router.replace('/join');
    if (user?.onboarding.completed) router.replace('/games');
  }, [user, router]);

  useEffect(() => {
    const message = oauthError
      ? oauthError === 'oauth_failed'
        ? 'Connecting that account failed. If you already use it on Peakelo, sign in with it instead.'
        : 'That connection did not finish.'
      : error;
    if (message) showError(message);
  }, [error, oauthError]);

  const linkedSources = availableSources(user?.accounts.map((account) => account.provider) ?? []);
  const selectedSources = selectedOverride ?? linkedSources;
  const focus = focusOverride ?? user?.onboarding.trainingFocus ?? '';
  const timeControls =
    timeControlsOverride ??
    (user && user.onboarding.timeControls.length > 0 ? user.onboarding.timeControls : ['rapid']);

  useEffect(() => {
    if (user?.onboarding.importStatus === 'failed' && user.onboarding.importError) {
      showError(user.onboarding.importError);
    }
  }, [user?.onboarding.importStatus, user?.onboarding.importError]);

  useEffect(() => {
    if (user?.onboarding.importStatus !== 'running') return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 1500);
    return () => window.clearInterval(timer);
  }, [user?.onboarding.importStatus, refresh]);

  if (user === undefined) {
    return <main className="px-6 py-16 text-text-sub-600">Loading your session…</main>;
  }
  if (!user || user.onboarding.completed) return null;

  const onboarding = user.onboarding;

  async function submit<T>(path: string, body: unknown): Promise<T> {
    setBusy(true);
    try {
      const result = await api<T>(path, { method: 'POST', body: JSON.stringify(body) });
      await refresh();
      return result;
    } catch (err) {
      showError(err instanceof ApiClientError ? err.message : 'That request failed.');
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppChrome user={user}>
      <main className="mx-auto flex max-w-2xl flex-col px-6 py-12">
        <div className="mb-8 flex flex-col gap-3">
          <StepRail current={stepNumber(onboarding.step)} total={4} />
        </div>
        {onboarding.step === 'connect' ? (
          <ConnectStep
            busy={busy}
            username={username}
            onUsername={setUsername}
            onLinkChesscom={() => void submit('/onboarding/chesscom', { username })}
          />
        ) : null}

        {onboarding.step === 'focus' ? (
          <FocusStep
            busy={busy}
            focus={focus}
            onFocus={setFocusOverride}
            onContinue={() => {
              if (!focus) {
                showError('Pick what you want to work on.');
                return;
              }
              void submit('/onboarding/intent', { trainingFocus: focus });
            }}
          />
        ) : null}

        {onboarding.step === 'note' ? (
          <NoteStep
            busy={busy}
            note={note}
            onNote={setNote}
            onSkip={() => void submit('/onboarding/note', { focusNote: '' })}
            onContinue={() => void submit('/onboarding/note', { focusNote: note })}
          />
        ) : null}

        {onboarding.step === 'import' ? (
          <ImportStep
            busy={busy || onboarding.importStatus === 'running'}
            onboarding={onboarding}
            linkedSources={linkedSources}
            selectedSources={selectedSources}
            onToggleSource={(next) =>
              setSelectedOverride((current) => {
                const base = current ?? selectedSources;
                return base.includes(next) ? base.filter((item) => item !== next) : [...base, next];
              })
            }
            timeControls={timeControls}
            onToggle={(control) =>
              setTimeControlsOverride((current) => {
                const base = current ?? timeControls;
                return base.includes(control)
                  ? base.filter((item) => item !== control)
                  : [...base, control];
              })
            }
            onImport={() => {
              if (timeControls.length === 0) {
                showError('Pick at least one time control.');
                return;
              }
              if (selectedSources.length === 0) {
                showError('Pick at least one site to import from.');
                return;
              }
              void submit('/onboarding/import', { timeControls, sources: selectedSources });
            }}
          />
        ) : null}
      </main>
    </AppChrome>
  );
}

function stepNumber(step: OnboardingState['step']): number {
  if (step === 'connect') return 1;
  if (step === 'focus') return 2;
  if (step === 'note') return 3;
  return 4;
}

function availableSources(providers: string[]): GameSource[] {
  const sources: GameSource[] = [];
  if (providers.includes('lichess')) sources.push('lichess');
  if (providers.includes('chesscom')) sources.push('chesscom');
  return sources;
}

function StepRail({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3" aria-label={`Step ${current} of ${total}`}>
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: total }, (_, index) => {
          const n = index + 1;
          return (
            <span
              key={n}
              className={cn(
                'size-3 border-2 border-ink',
                n < current && 'bg-ink',
                n === current && 'bg-primary-base',
                n > current && 'bg-paper',
              )}
            />
          );
        })}
      </div>
      <span className="font-mono text-sm text-text-sub-600">
        {current} of {total}
      </span>
    </div>
  );
}

function StepIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-3">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">{title}</h1>
      <p className="max-w-xl text-lg text-text-sub-600">{children}</p>
    </header>
  );
}

function ConnectStep({
  busy,
  username,
  onUsername,
  onLinkChesscom,
}: {
  busy: boolean;
  username: string;
  onUsername: (value: string) => void;
  onLinkChesscom: () => void;
}) {
  return (
    <div>
      <StepIntro title="Connect a chess account.">
        Link Lichess, Chess.com, or both so we can import the games you play.
      </StepIntro>
      <ChoiceSheet>
        <ChoiceLink href={oauthStartUrl('lichess', 'link')}>
          <LichessLogo className="size-6 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-display font-bold">Lichess</span>
            <span className="block text-sm font-normal text-text-sub-600">
              Sign in to import your games.
            </span>
          </span>
          <span className="font-display text-sm font-bold text-primary-base">Connect</span>
        </ChoiceLink>
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <ChesscomLogo className="size-6 shrink-0" />
            <div className="min-w-0">
              <p className="font-display font-bold">Chess.com</p>
              <p className="text-sm text-text-sub-600">
                Public username. It does not have to match Lichess.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input.Root className="flex-1">
              <Input.Wrapper>
                <Input.Input
                  id="chesscom-username"
                  value={username}
                  onChange={(event) => onUsername(event.target.value)}
                  placeholder="your_username"
                  autoComplete="username"
                />
              </Input.Wrapper>
            </Input.Root>
            <Button.Root
              type="button"
              className="w-full sm:w-fit"
              disabled={busy || username.trim().length < 3}
              onClick={onLinkChesscom}
            >
              Link
            </Button.Root>
          </div>
        </div>
      </ChoiceSheet>
    </div>
  );
}

function FocusStep({
  busy,
  focus,
  onFocus,
  onContinue,
}: {
  busy: boolean;
  focus: TrainingFocus | '';
  onFocus: (value: TrainingFocus) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepIntro title="What do you want?">
        Pick the one thing you would most like Peakelo to train. You can change this later.
      </StepIntro>
      <ChoiceSheet role="radiogroup" aria-label="Training focus">
        {FOCUS_OPTIONS.map(([id, label]) => {
          const on = focus === id;
          return (
            <ChoiceRow
              key={id}
              role="radio"
              aria-checked={on}
              selected={on}
              disabled={busy}
              onClick={() => onFocus(id)}
            >
              <ChoiceMark on={on} />
              <span className="font-display font-bold">{label}</span>
            </ChoiceRow>
          );
        })}
      </ChoiceSheet>
      <Button.Root type="button" className="mt-6 w-fit" disabled={busy || !focus} onClick={onContinue}>
        Continue
      </Button.Root>
    </div>
  );
}

function NoteStep({
  busy,
  note,
  onNote,
  onSkip,
  onContinue,
}: {
  busy: boolean;
  note: string;
  onNote: (value: string) => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepIntro title="Say more, if you want.">
        Optional. Things like “my positional play is bad because in some structures I do not know
        what to do after the opening.”
      </StepIntro>
      <label htmlFor="focus-note" className="mb-2 block font-display text-sm font-bold">
        The messy version
      </label>
      <textarea
        id="focus-note"
        value={note}
        onChange={(event) => onNote(event.target.value)}
        rows={6}
        maxLength={2000}
        className="w-full border-2 border-ink bg-bg-white-0 p-3 text-sm shadow-regular-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        placeholder="I keep hanging pieces when they plant a knight on e3…"
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <Button.Root type="button" className="w-fit" disabled={busy} onClick={onContinue}>
          Save note
        </Button.Root>
        <button
          type="button"
          className="cursor-pointer font-display text-sm font-bold text-text-sub-600 underline decoration-2 underline-offset-4 disabled:cursor-not-allowed disabled:no-underline"
          disabled={busy}
          onClick={onSkip}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

function ImportStep({
  busy,
  onboarding,
  linkedSources,
  selectedSources,
  onToggleSource,
  timeControls,
  onToggle,
  onImport,
}: {
  busy: boolean;
  onboarding: OnboardingState;
  linkedSources: GameSource[];
  selectedSources: GameSource[];
  onToggleSource: (value: GameSource) => void;
  timeControls: TimeControl[];
  onToggle: (value: TimeControl) => void;
  onImport: () => void;
}) {
  return (
    <div>
      <StepIntro title="Import your games.">
        We take your last {INITIAL_IMPORT_LIMIT} games from each site you pick, then sync new ones
        every 30 minutes.
      </StepIntro>
      <ChoiceSheet aria-label="Import settings">
        <ChoiceHeader>Sites</ChoiceHeader>
        {linkedSources.map((item) => {
          const on = selectedSources.includes(item);
          const name = item === 'lichess' ? 'Lichess' : 'Chess.com';
          return (
            <ChoiceRow
              key={item}
              selected={on}
              disabled={busy}
              onClick={() => onToggleSource(item)}
            >
              <ChoiceMark on={on} />
              {item === 'lichess' ? (
                <LichessLogo className="size-5 shrink-0" />
              ) : (
                <ChesscomLogo className="size-5 shrink-0" />
              )}
              <span className="min-w-0 flex-1 font-display font-bold">{name}</span>
              <span className="font-mono text-xs text-text-sub-600">
                last {INITIAL_IMPORT_LIMIT}
              </span>
            </ChoiceRow>
          );
        })}
        {!linkedSources.includes('lichess') ? (
          <ChoiceLink href={oauthStartUrl('lichess', 'link')}>
            <span className="w-5 text-center font-display text-lg font-bold text-primary-base">
              +
            </span>
            <LichessLogo className="size-5 shrink-0" />
            <span className="font-display font-bold">Also connect Lichess</span>
          </ChoiceLink>
        ) : null}
        {!linkedSources.includes('chesscom') ? (
          <ChoiceLink href="/connect/chesscom">
            <span className="w-5 text-center font-display text-lg font-bold text-primary-base">
              +
            </span>
            <ChesscomLogo className="size-5 shrink-0" />
            <span className="font-display font-bold">Also connect Chess.com</span>
          </ChoiceLink>
        ) : null}
        <ChoiceHeader>Time control</ChoiceHeader>
        <div className="grid grid-cols-3" role="group" aria-label="Time control">
          {TIME_CONTROLS.map((item) => {
            const on = timeControls.includes(item.id);
            return (
              <SegmentCell
                key={item.id}
                selected={on}
                disabled={busy}
                onClick={() => onToggle(item.id)}
              >
                <span className="font-display text-sm font-bold">{item.label}</span>
                <span
                  className={cn(
                    'font-mono text-xs',
                    on ? 'text-text-white-0/80' : 'text-text-sub-600',
                  )}
                >
                  {item.hint}
                </span>
              </SegmentCell>
            );
          })}
        </div>
      </ChoiceSheet>
      <div className="mt-6 flex flex-col gap-4">
        <ImportTicker active={busy} />
        <Button.Root type="button" className="w-fit" disabled={busy} onClick={onImport}>
          {onboarding.importStatus === 'failed' ? 'Try import again' : 'Import games'}
        </Button.Root>
      </div>
    </div>
  );
}
