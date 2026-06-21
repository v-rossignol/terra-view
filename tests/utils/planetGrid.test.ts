import { describe, expect, it } from 'vitest';
import { getPlanetGridHeight, rollRandomHex } from '@utils/planetGrid';

describe('planetGrid', () => {
  it('computes grid height as radius + 1', () => {
    expect(getPlanetGridHeight(5)).toBe(6);
  });

  it('rolls hex coordinates within planet bounds', () => {
    const radius = 8;
    const hex = rollRandomHex(radius);

    expect(hex.q).toBeGreaterThanOrEqual(0);
    expect(hex.q).toBeLessThan(radius);
    expect(hex.r).toBeGreaterThanOrEqual(0);
    expect(hex.r).toBeLessThan(getPlanetGridHeight(radius));
  });
});
