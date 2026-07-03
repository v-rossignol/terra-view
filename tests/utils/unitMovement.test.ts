import { describe, expect, it } from 'vitest';
import {
  getBiomeAllowedMoveDestinationHexes,
  getValidMoveDestinationHexes,
  hexCoordsKey,
  isBiomeAllowedForUnit,
  isBiomeAllowedMoveDestination,
  isValidMoveDestinationHex,
} from '@utils/unitMovement';

describe('unitMovement', () => {
  const origin = { q: 2, r: 3 };
  const radius = 10;
  const hexes = [
    { coordinates: { q: 2, r: 3 }, biome: 'forest' },
    { coordinates: { q: 2, r: 4 }, biome: 'ocean' },
    { coordinates: { q: 3, r: 3 }, biome: 'desert' },
  ];

  it('returns origin and rendered-surface neighbors', () => {
    const destinations = getValidMoveDestinationHexes(origin, radius);

    expect(destinations).toHaveLength(7);
    expect(destinations[0]).toEqual(origin);
    expect(destinations).toContainEqual({ q: 2, r: 4 });
    expect(destinations).toContainEqual({ q: 3, r: 3 });
  });

  it('validates origin and neighbor hexes', () => {
    expect(isValidMoveDestinationHex(origin, origin, radius)).toBe(true);
    expect(isValidMoveDestinationHex(origin, { q: 2, r: 4 }, radius)).toBe(true);
    expect(isValidMoveDestinationHex(origin, { q: 5, r: 5 }, radius)).toBe(false);
  });

  it('checks biome allowance against unit environments', () => {
    expect(isBiomeAllowedForUnit('forest', ['forest', 'plain'])).toBe(true);
    expect(isBiomeAllowedForUnit('ocean', ['forest', 'plain'])).toBe(false);
  });

  it('always allows repositioning within the origin hex', () => {
    expect(isBiomeAllowedMoveDestination(origin, origin, ['forest'], hexes)).toBe(true);
  });

  it('filters neighbors by biome environments', () => {
    const destinations = getBiomeAllowedMoveDestinationHexes(origin, radius, hexes, ['forest', 'plain']);

    expect(destinations).toContainEqual(origin);
    expect(destinations).not.toContainEqual({ q: 2, r: 4 });
    expect(destinations).not.toContainEqual({ q: 3, r: 3 });
  });

  it('includes neighbors whose biome matches unit environments', () => {
    const destinations = getBiomeAllowedMoveDestinationHexes(origin, radius, hexes, ['forest', 'ocean']);

    expect(destinations).toContainEqual(origin);
    expect(destinations).toContainEqual({ q: 2, r: 4 });
    expect(destinations).not.toContainEqual({ q: 3, r: 3 });
  });

  it('builds stable hex coordinate keys', () => {
    expect(hexCoordsKey({ q: 2, r: 3 })).toBe('2,3');
  });
});
