import type { AuthAccount, EnginePass, Onboarding, User } from '@prisma/client';
import { gameSourcesFromAccounts, type PublicUser } from '@peakelo/shared';
import { resolveOnboardingStep } from '../onboarding/step';
import { toEnginePass } from '../profile/service';

type UserWithRelations = User & {
  accounts: AuthAccount[];
  onboarding: Onboarding | null;
  enginePass?: EnginePass | null;
};

export function hasChessPlatform(accounts: AuthAccount[]): boolean {
  return accounts.some(
    (account) => account.provider === 'lichess' || account.provider === 'chesscom',
  );
}

export function toPublicUser(user: UserWithRelations): PublicUser {
  const accounts = user.accounts;
  const onboarding = user.onboarding;
  const chessLinked = hasChessPlatform(accounts);
  const step = resolveOnboardingStep({
    hasChessPlatform: chessLinked,
    trainingFocus: onboarding?.trainingFocus ?? null,
    noteAsked: onboarding?.noteAsked ?? false,
    importStatus: onboarding?.importStatus ?? 'idle',
    completedAt: onboarding?.completedAt ?? null,
  });
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    accounts: accounts.map((account) => ({
      provider: account.provider,
      username: account.username,
    })),
    gameSources: gameSourcesFromAccounts(accounts),
    onboarding: {
      step,
      completed: step === 'done',
      trainingFocus: onboarding?.trainingFocus ?? null,
      focusNote: onboarding?.focusNote ?? null,
      noteAsked: onboarding?.noteAsked ?? false,
      timeControls: onboarding?.timeControls ?? [],
      importSource: onboarding?.importSource ?? null,
      importStatus: onboarding?.importStatus ?? 'idle',
      importedCount: onboarding?.importedCount ?? 0,
      importError: onboarding?.importError ?? null,
      hasChessPlatform: chessLinked,
    },
    enginePass: toEnginePass(user.enginePass ?? null),
  };
}

export function postAuthPath(user: UserWithRelations): '/onboarding' | '/home' {
  return toPublicUser(user).onboarding.completed ? '/home' : '/onboarding';
}
