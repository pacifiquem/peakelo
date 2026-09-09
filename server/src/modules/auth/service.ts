import type { AuthProvider } from '@peakelo/shared';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../common/errors';
import { env } from '../../config/env';
import { getPrisma } from '../../db/prisma';
import { encryptSecret } from '../../lib/crypto';
import { safeEqual } from '../../lib/crypto';
import {
  buildAuthorizationUrl,
  configuredProviders,
  exchangeAuthorizationCode,
  fetchProviderProfile,
  isProviderConfigured,
} from './providers';
import { createOAuthState, readOAuthState, type OAuthIntent } from './oauth-state';
import { importLinkedSources } from '../games/import-games';
import { createSession } from './session';
import { postAuthPath } from './public-user';

function apiOrigin(): string {
  return env.API_PUBLIC_URL.replace(/\/$/, '');
}

export function listAuthProviders() {
  return { providers: configuredProviders() };
}

export function startOAuth(provider: AuthProvider, intent: OAuthIntent, hasSession: boolean) {
  if (!isProviderConfigured(provider)) {
    throw new BadRequestError('This sign-in method is not available right now.');
  }
  if (intent === 'link' && !hasSession) {
    throw new UnauthorizedError('Sign in before linking an account');
  }
  const { packed, challenge, nonce } = createOAuthState(env.sessionSecret, provider, intent);
  const redirectUrl = buildAuthorizationUrl({
    provider,
    origin: apiOrigin(),
    nonce,
    challenge,
  });
  return { packed, redirectUrl };
}

export async function finishOAuth(input: {
  provider: AuthProvider;
  code: string | undefined;
  nonce: string | undefined;
  packedState: string | undefined;
  currentUserId: string | null;
}): Promise<{ token: string; nextPath: '/onboarding' | '/games' }> {
  if (!input.code || !input.nonce) {
    throw new BadRequestError('OAuth callback was missing code or state');
  }
  const state = readOAuthState(env.sessionSecret, input.packedState);
  if (!state || state.provider !== input.provider || !safeEqual(state.nonce, input.nonce)) {
    throw new BadRequestError('OAuth state was invalid or expired');
  }

  const tokens = await exchangeAuthorizationCode({
    provider: input.provider,
    origin: apiOrigin(),
    code: input.code,
    verifier: state.verifier,
  });
  const profile = await fetchProviderProfile(input.provider, tokens.accessToken);
  const accessTokenEnc = encryptSecret(env.sessionSecret, tokens.accessToken);
  const refreshTokenEnc = tokens.refreshToken
    ? encryptSecret(env.sessionSecret, tokens.refreshToken)
    : null;

  const prisma = getPrisma();
  const existing = await prisma.authAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
  });

  const accountData = {
    username: profile.username,
    accessTokenEnc,
    refreshTokenEnc,
    tokenExpiresAt: tokens.expiresAt,
  };

  let userId: string;
  if (state.intent === 'link') {
    if (!input.currentUserId) throw new UnauthorizedError('Sign in before linking an account');
    if (existing && existing.userId !== input.currentUserId) {
      throw new ConflictError('That chess account is already linked to someone else');
    }
    userId = input.currentUserId;
    await prisma.authAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      create: {
        userId,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        ...accountData,
      },
      update: accountData,
    });
    if (profile.email) {
      await prisma.user.updateMany({
        where: { id: userId, email: null },
        data: { email: profile.email },
      });
    }
  } else if (existing) {
    userId = existing.userId;
    await prisma.authAccount.update({
      where: { id: existing.id },
      data: accountData,
    });
  } else {
    const byEmail = profile.email
      ? await prisma.user.findUnique({ where: { email: profile.email } })
      : null;
    if (byEmail) {
      userId = byEmail.id;
      await prisma.authAccount.create({
        data: {
          userId,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          ...accountData,
        },
      });
    } else {
      const created = await prisma.user.create({
        data: {
          email: profile.email,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          accounts: {
            create: {
              provider: profile.provider,
              providerAccountId: profile.providerAccountId,
              ...accountData,
            },
          },
          onboarding: { create: {} },
        },
      });
      userId = created.id;
    }
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { accounts: true, onboarding: true },
  });

  if (
    state.intent === 'link' &&
    user.onboarding?.completedAt &&
    (profile.provider === 'lichess' || profile.provider === 'chesscom')
  ) {
    const timeControls =
      user.onboarding.timeControls.length > 0
        ? user.onboarding.timeControls
        : (['bullet', 'blitz', 'rapid'] as const);
    void importLinkedSources({
      userId,
      sources: [profile.provider],
      timeControls: [...timeControls],
      completeOnboarding: false,
    });
  }

  const token = await createSession(userId);
  return { token, nextPath: postAuthPath(user) };
}
