import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';

const app = buildApp();
const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

describe('auth routes', () => {
  afterAll(async () => {
    await app.close();
  });

  it('lists which OAuth providers are configured', async () => {
    const response = await app.inject({ method: 'GET', url: '/auth/providers' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      providers: [
        { id: 'google', configured: googleConfigured },
        { id: 'lichess', configured: true },
        { id: 'chesscom', configured: false },
      ],
    });
  });

  it('returns no user without a session cookie', async () => {
    const response = await app.inject({ method: 'GET', url: '/me' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user: null });
  });

  it('rejects onboarding writes without a session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/onboarding/intent',
      payload: { trainingFocus: 'tactics' },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
  });

  it('starts Lichess OAuth with PKCE', async () => {
    const response = await app.inject({ method: 'GET', url: '/auth/lichess' });
    expect(response.statusCode).toBe(302);
    const location = response.headers.location;
    expect(location).toContain('https://lichess.org/oauth?');
    expect(location).toContain('code_challenge_method=S256');
    expect(location).toContain('client_id=peakelo-test');
    expect(response.cookies.some((cookie) => cookie.name === 'peakelo_oauth')).toBe(true);
  });

  it('starts Google OAuth or rejects it if credentials are missing', async () => {
    const response = await app.inject({ method: 'GET', url: '/auth/google' });
    expect(response.statusCode).toBe(302);
    if (googleConfigured) {
      expect(response.headers.location).toContain('accounts.google.com');
    } else {
      expect(response.headers.location).toContain('/join?error=oauth_start');
    }
  });
});
