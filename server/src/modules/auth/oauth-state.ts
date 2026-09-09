import type { AuthProvider } from '@peakelo/shared';
import { OAUTH_STATE_TTL_MS } from '@peakelo/shared';
import { createPkce, randomToken, signPayload, verifyPayload } from '../../lib/crypto';

export type OAuthIntent = 'login' | 'link';

export interface OAuthState {
  nonce: string;
  verifier: string;
  provider: AuthProvider;
  intent: OAuthIntent;
  createdAt: number;
}

export function createOAuthState(
  secret: string,
  provider: AuthProvider,
  intent: OAuthIntent,
): { packed: string; challenge: string; nonce: string } {
  const { verifier, challenge } = createPkce();
  const state: OAuthState = {
    nonce: randomToken(16),
    verifier,
    provider,
    intent,
    createdAt: Date.now(),
  };
  return { packed: signPayload(secret, JSON.stringify(state)), challenge, nonce: state.nonce };
}

export function readOAuthState(secret: string, packed: string | undefined): OAuthState | null {
  if (!packed) return null;
  const payload = verifyPayload(secret, packed);
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as OAuthState;
    if (!parsed.nonce || !parsed.verifier || !parsed.provider || !parsed.intent) return null;
    if (Date.now() - parsed.createdAt > OAUTH_STATE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}
