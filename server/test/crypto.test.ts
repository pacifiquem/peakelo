import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret, signPayload, verifyPayload } from '../src/lib/crypto';

const SECRET = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

describe('crypto helpers', () => {
  it('encrypts and decrypts provider tokens', () => {
    const packed = encryptSecret(SECRET, 'lichess-token');
    expect(packed).not.toContain('lichess-token');
    expect(decryptSecret(SECRET, packed)).toBe('lichess-token');
  });

  it('signs and verifies oauth state payloads', () => {
    const packed = signPayload(SECRET, '{"ok":true}');
    expect(verifyPayload(SECRET, packed)).toBe('{"ok":true}');
    expect(verifyPayload(SECRET, 'nope')).toBeNull();
  });
});
