import { describe, expect, it } from 'vitest';
import type { UnitInstance } from '../../src/types/unit';
import { getUnitHexCoords, groupUnitsByHex } from '@utils/unitLocation';

const baseUnit = (overrides: Partial<UnitInstance> = {}): UnitInstance => ({
  id: 'unit-1',
  typeId: 'scout-x1',
  ownerId: 'player-1',
  location: {
    cube: { id: 'cube-1' },
    starSystem: { id: 'system-1' },
    planet: {
      id: 'planet-1',
      hex_coords: { q: 2, r: 3 },
      position: { x: 0.2, y: 0.4 },
    },
  },
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  metadata: {},
  type: {
    id: 'scout-x1',
    name: 'Scout-X1',
    type: 'vehicule',
    size: 'small',
    mobility: true,
    speed: 1,
    environments: ['forest'],
    rules: [{ range: 'hexagon', value: 1 }],
    capabilities: {},
    description: null,
    metadata: {},
  },
  ...overrides,
});

describe('unitLocation', () => {
  it('extracts hex coordinates from a planet unit location', () => {
    expect(getUnitHexCoords(baseUnit())).toEqual({ q: 2, r: 3 });
  });

  it('returns null when the unit has no hex coordinates', () => {
    expect(
      getUnitHexCoords(
        baseUnit({
          location: {
            cube: { id: 'cube-1' },
            starSystem: { id: 'system-1' },
            planet: { id: 'planet-1' },
          },
        }),
      ),
    ).toBeNull();
  });

  it('groups active units by hex and skips destroyed units', () => {
    const grouped = groupUnitsByHex([
      baseUnit({ id: 'unit-1' }),
      baseUnit({
        id: 'unit-2',
        location: {
          cube: { id: 'cube-1' },
          starSystem: { id: 'system-1' },
          planet: {
            id: 'planet-1',
            hex_coords: { q: 2, r: 3 },
            position: { x: 0.6, y: 0.1 },
          },
        },
      }),
      baseUnit({
        id: 'unit-3',
        status: 'destroyed',
        location: {
          cube: { id: 'cube-1' },
          starSystem: { id: 'system-1' },
          planet: {
            id: 'planet-1',
            hex_coords: { q: 4, r: 1 },
            position: { x: 0.1, y: 0.9 },
          },
        },
      }),
    ]);

    expect(grouped.get('2,3')).toHaveLength(2);
    expect(grouped.has('4,1')).toBe(false);
  });
});
