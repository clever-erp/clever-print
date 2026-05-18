import { describe, it, expect } from 'vitest';
import { generateToken, generateCode } from '../src/main/pairing/token';

describe('pairing/token', () => {
  it('generateToken returns >= 32 bytes base64url', () => {
    const t = generateToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generateCode returns 6 digits', () => {
    for (let i = 0; i < 50; i++) {
      const c = generateCode();
      expect(c).toMatch(/^\d{6}$/);
    }
  });

  it('tokens are unique across calls', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(generateToken());
    expect(seen.size).toBe(100);
  });
});
