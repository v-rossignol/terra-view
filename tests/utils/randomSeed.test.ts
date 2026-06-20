import { describe, expect, it } from 'vitest';
import { createRandomSeed } from '@utils/randomSeed';

describe('createRandomSeed', () => {
  it('returns a non-empty string', () => {
    expect(createRandomSeed()).toMatch(/\S/);
  });

  it('returns a different value on each call', () => {
    expect(createRandomSeed()).not.toBe(createRandomSeed());
  });
});
