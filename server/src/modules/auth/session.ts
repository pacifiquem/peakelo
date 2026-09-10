import type { FastifyReply, FastifyRequest } from 'fastify';
import { SESSION_COOKIE_NAME, SESSION_TTL_MS, type PublicUser } from '@peakelo/shared';
import { UnauthorizedError } from '../../common/errors';
import { env } from '../../config/env';
import { getPrisma } from '../../db/prisma';
import { randomToken, sha256Hex } from '../../lib/crypto';
import { toPublicUser } from './public-user';

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

export async function createSession(userId: string): Promise<string> {
  const token = randomToken(32);
  await getPrisma().session.create({
    data: {
      userId,
      tokenHash: sha256Hex(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await getPrisma().session.deleteMany({ where: { tokenHash: sha256Hex(token) } });
}

export async function loadUserFromToken(token: string | undefined): Promise<PublicUser | null> {
  if (!token) return null;
  const session = await getPrisma().session.findUnique({
    where: { tokenHash: sha256Hex(token) },
    include: { user: { include: { accounts: true, onboarding: true, enginePass: true } } },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await getPrisma()
        .session.delete({ where: { id: session.id } })
        .catch(() => undefined);
    }
    return null;
  }
  return toPublicUser(session.user);
}

export function readSessionToken(request: FastifyRequest): string | undefined {
  return request.cookies[SESSION_COOKIE_NAME];
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

export async function requireUser(request: FastifyRequest): Promise<PublicUser> {
  const user = await loadUserFromToken(readSessionToken(request));
  if (!user) throw new UnauthorizedError();
  return user;
}
