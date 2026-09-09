import type { GameSource, TimeControl, TrainingFocus } from '@peakelo/shared';
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors';
import { getPrisma } from '../../db/prisma';
import { UpstreamError } from '../../lib/http';
import { toPublicUser } from '../auth/public-user';
import { fetchChesscomProfile } from '../games/platforms/chesscom';
import { importLinkedSources } from '../games/import-games';

export async function getOnboarding(userId: string) {
  const user = await getPrisma().user.findUniqueOrThrow({
    where: { id: userId },
    include: { accounts: true, onboarding: true },
  });
  return toPublicUser(user).onboarding;
}

export async function saveIntent(userId: string, trainingFocus: TrainingFocus) {
  const prisma = getPrisma();
  await prisma.onboarding.upsert({
    where: { userId },
    create: { userId, trainingFocus },
    update: { trainingFocus },
  });
  return getOnboarding(userId);
}

export async function saveNote(userId: string, focusNote: string) {
  const prisma = getPrisma();
  await prisma.onboarding.upsert({
    where: { userId },
    create: { userId, focusNote: focusNote || null, noteAsked: true },
    update: { focusNote: focusNote || null, noteAsked: true },
  });
  return getOnboarding(userId);
}

export async function linkChesscomUsername(userId: string, username: string) {
  let profile;
  try {
    profile = await fetchChesscomProfile(username);
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 404) {
      throw new NotFoundError('Chess.com player');
    }
    throw error;
  }

  const prisma = getPrisma();
  const existing = await prisma.authAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'chesscom',
        providerAccountId: profile.id,
      },
    },
  });
  if (existing && existing.userId !== userId) {
    throw new ConflictError('That Chess.com account is already linked to someone else');
  }

  await prisma.authAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'chesscom',
        providerAccountId: profile.id,
      },
    },
    create: {
      userId,
      provider: 'chesscom',
      providerAccountId: profile.id,
      username: profile.username,
    },
    update: { username: profile.username },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { onboarding: true },
  });
  if (user.avatarUrl === null && profile.avatarUrl) {
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: profile.avatarUrl },
    });
  }

  return getOnboarding(userId);
}

export async function startOnboardingImport(
  userId: string,
  timeControls: TimeControl[],
  sources: GameSource[],
) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { accounts: true, onboarding: true },
  });
  for (const source of sources) {
    const account = user.accounts.find((item) => item.provider === source);
    if (!account?.username) {
      throw new BadRequestError(`Connect a ${source} account before importing`);
    }
  }
  if (!user.onboarding?.trainingFocus) {
    throw new BadRequestError('Choose what you want to work on before importing');
  }
  if (!user.onboarding.noteAsked) {
    throw new BadRequestError('Finish the optional note step (you can skip it) before importing');
  }

  const runningStuck =
    user.onboarding.importStatus === 'running' &&
    Date.now() - user.onboarding.updatedAt.getTime() > 2 * 60 * 1000;
  if (user.onboarding.importStatus === 'running' && !runningStuck) {
    throw new BadRequestError('An import is already running');
  }

  await prisma.onboarding.update({
    where: { userId },
    data: {
      timeControls,
      importSource: sources[0],
      importStatus: 'running',
      importError: null,
    },
  });

  void importLinkedSources({
    userId,
    sources,
    timeControls,
    completeOnboarding: !user.onboarding.completedAt,
  });

  return getOnboarding(userId);
}
