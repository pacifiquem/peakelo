import type { AuthProvider } from '@peakelo/shared';
import { env } from '../../config/env';
import { fetchJson, fetchWithTimeout, UpstreamError } from '../../lib/http';

export interface OAuthProfile {
  provider: AuthProvider;
  providerAccountId: string;
  username: string | null;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}

export interface ProviderConfig {
  id: AuthProvider;
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
  tokenFormat: 'form' | 'json';
  extraAuthParams?: Record<string, string>;
}

export function configuredProviders(): { id: AuthProvider; configured: boolean }[] {
  return [
    { id: 'google', configured: env.googleConfigured },
    { id: 'lichess', configured: true },
    { id: 'chesscom', configured: env.chesscomOAuthConfigured },
  ];
}

export function isProviderConfigured(provider: AuthProvider): boolean {
  return configuredProviders().some((item) => item.id === provider && item.configured);
}

export function getProviderConfig(provider: AuthProvider): ProviderConfig {
  if (provider === 'google') {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth is not configured');
    }
    return {
      id: 'google',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      scopes: ['openid', 'email', 'profile'],
      tokenFormat: 'form',
      extraAuthParams: { access_type: 'online', prompt: 'select_account' },
    };
  }
  if (provider === 'lichess') {
    return {
      id: 'lichess',
      authorizationUrl: 'https://lichess.org/oauth',
      tokenUrl: 'https://lichess.org/api/token',
      clientId: env.LICHESS_CLIENT_ID,
      scopes: ['email:read'],
      tokenFormat: 'json',
    };
  }
  if (
    !env.CHESSCOM_CLIENT_ID ||
    !env.CHESSCOM_CLIENT_SECRET ||
    !env.CHESSCOM_AUTHORIZATION_URL ||
    !env.CHESSCOM_TOKEN_URL
  ) {
    throw new Error('Chess.com OAuth is not configured');
  }
  return {
    id: 'chesscom',
    authorizationUrl: env.CHESSCOM_AUTHORIZATION_URL,
    tokenUrl: env.CHESSCOM_TOKEN_URL,
    clientId: env.CHESSCOM_CLIENT_ID,
    clientSecret: env.CHESSCOM_CLIENT_SECRET,
    scopes: env.CHESSCOM_SCOPE ? env.CHESSCOM_SCOPE.split(/\s+/).filter(Boolean) : [],
    tokenFormat: 'form',
  };
}

export function callbackUrl(provider: AuthProvider, origin: string): string {
  return `${origin}/auth/${provider}/callback`;
}

export function buildAuthorizationUrl(input: {
  provider: AuthProvider;
  origin: string;
  nonce: string;
  challenge: string;
}): string {
  const config = getProviderConfig(input.provider);
  const url = new URL(config.authorizationUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', callbackUrl(input.provider, input.origin));
  url.searchParams.set('state', input.nonce);
  url.searchParams.set('code_challenge', input.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (config.scopes.length > 0) {
    url.searchParams.set('scope', config.scopes.join(' '));
  }
  for (const [key, value] of Object.entries(config.extraAuthParams ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export async function exchangeAuthorizationCode(input: {
  provider: AuthProvider;
  origin: string;
  code: string;
  verifier: string;
}): Promise<{ accessToken: string; refreshToken: string | null; expiresAt: Date | null }> {
  const config = getProviderConfig(input.provider);
  const redirectUri = callbackUrl(input.provider, input.origin);
  const body =
    config.tokenFormat === 'json'
      ? JSON.stringify({
          grant_type: 'authorization_code',
          code: input.code,
          code_verifier: input.verifier,
          client_id: config.clientId,
          redirect_uri: redirectUri,
        })
      : new URLSearchParams({
          grant_type: 'authorization_code',
          code: input.code,
          code_verifier: input.verifier,
          client_id: config.clientId,
          redirect_uri: redirectUri,
          ...(config.clientSecret ? { client_secret: config.clientSecret } : {}),
        });

  const response = await fetchWithTimeout(config.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type':
        config.tokenFormat === 'json' ? 'application/json' : 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!response.ok) {
    throw new UpstreamError(`Token exchange failed (${response.status})`, response.status);
  }
  const json = (await response.json()) as TokenResponse;
  if (!json.access_token) {
    throw new UpstreamError('Token exchange returned no access_token', 502);
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null,
  };
}

export async function fetchProviderProfile(
  provider: AuthProvider,
  accessToken: string,
): Promise<Omit<OAuthProfile, 'accessToken' | 'refreshToken' | 'tokenExpiresAt'>> {
  if (provider === 'google') {
    const data = await fetchJson<{
      sub: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    }>('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
      provider,
      providerAccountId: data.sub,
      username: null,
      email: data.email_verified ? (data.email ?? null) : null,
      displayName: data.name || data.email || 'Player',
      avatarUrl: data.picture ?? null,
    };
  }

  if (provider === 'lichess') {
    const account = await fetchJson<{
      id: string;
      username: string;
    }>('https://lichess.org/api/account', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    let email: string | null = null;
    try {
      const emailBody = await fetchJson<{ email?: string }>(
        'https://lichess.org/api/account/email',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      email = emailBody.email ?? null;
    } catch {
      email = null;
    }
    return {
      provider,
      providerAccountId: account.id,
      username: account.username,
      email,
      displayName: account.username,
      avatarUrl: null,
    };
  }

  if (!env.CHESSCOM_USERINFO_URL) {
    throw new Error('Chess.com OAuth is not configured');
  }
  const data = await fetchJson<Record<string, unknown>>(env.CHESSCOM_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const nested = (data.user ?? data.player ?? {}) as Record<string, unknown>;
  const id = String(data.id ?? data.user_id ?? data.uuid ?? nested.id ?? '');
  const username = String(data.username ?? nested.username ?? '');
  if (!id) {
    throw new UpstreamError('Chess.com userinfo did not include an id', 502);
  }
  return {
    provider,
    providerAccountId: id,
    username: username || null,
    email: typeof data.email === 'string' ? data.email : null,
    displayName: username || 'Chess.com player',
    avatarUrl: typeof data.avatar === 'string' ? data.avatar : null,
  };
}
