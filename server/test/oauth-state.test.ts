import { describe, expect, it } from 'vitest';
import { createOAuthState, readOAuthState } from '../src/modules/auth/oauth-state';

const SECRET = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

describe('oauth state', () => {
  it('round-trips a signed login state', () => {
    const created = createOAuthState(SECRET, 'lichess', 'login');
    const read = readOAuthState(SECRET, created.packed);
    expect(read?.provider).toBe('lichess');
    expect(read?.intent).toBe('login');
    expect(read?.nonce).toBe(created.nonce);
    expect(read?.verifier.length).toBeGreaterThan(20);
  });

  it('rejects a tampered payload', () => {
    const created = createOAuthState(SECRET, 'google', 'login');
    expect(readOAuthState(SECRET, `${created.packed}x`)).toBeNull();
  });

  it('rejects a missing cookie', () => {
    expect(readOAuthState(SECRET, undefined)).toBeNull();
  });
});
