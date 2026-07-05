import { PLANET_GARAGE_RANGE_HEX } from '@infinity/shared-config';
import { describe, expect, it } from 'vitest';
import { isWithinGarageRange } from '../../src/utils/unitGarageRange';

describe('unitGarageRange', () => {
  const planetRadius = 10;
  const hex = { q: 5, r: 3 };

  it('returns true when units are at the same position', () => {
    const point = { hex, position: { x: 0.5, y: 0.5 } };
    expect(isWithinGarageRange(point, point, planetRadius)).toBe(true);
  });

  it('returns true when surface distance is within PLANET_GARAGE_RANGE_HEX', () => {
    const from = { hex, position: { x: 0.5, y: 0.5 } };
    const to = { hex, position: { x: 0.51, y: 0.5 } };
    expect(isWithinGarageRange(from, to, planetRadius)).toBe(true);
  });

  it('returns false when surface distance exceeds PLANET_GARAGE_RANGE_HEX', () => {
    const from = { hex, position: { x: 0.1, y: 0.5 } };
    const to = { hex, position: { x: 0.9, y: 0.5 } };
    expect(isWithinGarageRange(from, to, planetRadius)).toBe(false);
    expect(PLANET_GARAGE_RANGE_HEX).toBe(0.16);
  });
});
