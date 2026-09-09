import type { FastifyInstance } from 'fastify';
import { OAUTH_COOKIE_NAME, authProviderSchema } from '@peakelo/shared';
import { env } from '../../config/env';
import { finishOAuth, listAuthProviders, startOAuth } from './service';
import {
  clearSessionCookie,
  destroySession,
  loadUserFromToken,
  readSessionToken,
  requireUser,
  setSessionCookie,
} from './session';

function clientRedirect(path: string, error?: string): string {
  const url = new URL(path, env.CLIENT_URL);
  if (error) url.searchParams.set('error', error);
  return url.toString();
}

function oauthCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 10 * 60,
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.get('/auth/providers', async () => listAuthProviders());

  app.get('/me', async (request) => {
    const user = await loadUserFromToken(readSessionToken(request));
    return { user };
  });

  app.post('/auth/logout', async (request, reply) => {
    await destroySession(readSessionToken(request));
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get<{ Params: { provider: string }; Querystring: { intent?: string } }>(
    '/auth/:provider',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const parsed = authProviderSchema.safeParse(request.params.provider);
      if (!parsed.success) {
        return reply.redirect(clientRedirect('/join', 'unknown_provider'));
      }
      const intent = request.query.intent === 'link' ? 'link' : 'login';
      try {
        const current = await loadUserFromToken(readSessionToken(request));
        const started = startOAuth(parsed.data, intent, Boolean(current));
        reply.setCookie(OAUTH_COOKIE_NAME, started.packed, oauthCookieOptions());
        return reply.redirect(started.redirectUrl);
      } catch (error) {
        request.log.warn({ err: error }, 'oauth start failed');
        return reply.redirect(
          clientRedirect(intent === 'link' ? '/onboarding' : '/join', 'oauth_start'),
        );
      }
    },
  );

  app.get<{
    Params: { provider: string };
    Querystring: { code?: string; state?: string; error?: string };
  }>('/auth/:provider/callback', async (request, reply) => {
    const parsed = authProviderSchema.safeParse(request.params.provider);
    if (!parsed.success) {
      return reply.redirect(clientRedirect('/join', 'unknown_provider'));
    }
    if (request.query.error) {
      return reply.redirect(clientRedirect('/join', 'oauth_denied'));
    }
    try {
      const current = await loadUserFromToken(readSessionToken(request));
      const result = await finishOAuth({
        provider: parsed.data,
        code: request.query.code,
        nonce: request.query.state,
        packedState: request.cookies[OAUTH_COOKIE_NAME],
        currentUserId: current?.id ?? null,
      });
      reply.clearCookie(OAUTH_COOKIE_NAME, { path: '/' });
      setSessionCookie(reply, result.token);
      return reply.redirect(clientRedirect(result.nextPath));
    } catch (error) {
      request.log.warn({ err: error }, 'oauth callback failed');
      return reply.redirect(clientRedirect('/join', 'oauth_failed'));
    }
  });

  app.get('/auth/session', async (request) => {
    const user = await requireUser(request);
    return { user };
  });
}
