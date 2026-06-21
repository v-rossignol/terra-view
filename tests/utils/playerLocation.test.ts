import { describe, expect, it } from 'vitest';
import { hasPlanetHex, isPlayerOnPlanet } from '@utils/playerLocation';

describe('isPlayerOnPlanet', () => {
  it('returns true for planet-depth location with hex', () => {
    const location = {
      cube: { id: 'cube-1' },
      starSystem: { id: 'system-1' },
      planet: { id: 'planet-1', hex_coords: { q: 2, r: 5 } },
    };

    expect(isPlayerOnPlanet(location)).toBe(true);
  });

  it('returns true for planet overview without hex_coords', () => {
    const location = {
      cube: { id: 'cube-1' },
      starSystem: { id: 'system-1' },
      planet: { id: 'planet-1' },
    };

    expect(isPlayerOnPlanet(location)).toBe(true);
  });

  it('returns false for null or non-object values', () => {
    expect(isPlayerOnPlanet(null)).toBe(false);
    expect(isPlayerOnPlanet(undefined)).toBe(false);
    expect(isPlayerOnPlanet('planet')).toBe(false);
  });

  it('returns false when planet id is missing or empty', () => {
    expect(isPlayerOnPlanet({ cube: { id: 'c' }, starSystem: { id: 's' } })).toBe(false);
    expect(
      isPlayerOnPlanet({
        cube: { id: 'c' },
        starSystem: { id: 's' },
        planet: { id: '', hex_coords: { q: 0, r: 0 } },
      }),
    ).toBe(false);
  });

  it('returns false for cube-depth location', () => {
    const location = {
      cube: { id: 'cube-1', position: { x: 0, y: 0, z: 0 } },
    };

    expect(isPlayerOnPlanet(location)).toBe(false);
  });
});

describe('hasPlanetHex', () => {
  it('returns true when hex_coords are present', () => {
    const location = {
      cube: { id: 'cube-1' },
      starSystem: { id: 'system-1' },
      planet: { id: 'planet-1', hex_coords: { q: 2, r: 5 } },
    };

    expect(hasPlanetHex(location)).toBe(true);
  });

  it('returns false for planet overview', () => {
    const location = {
      cube: { id: 'cube-1' },
      starSystem: { id: 'system-1' },
      planet: { id: 'planet-1' },
    };

    expect(hasPlanetHex(location)).toBe(false);
  });
});
