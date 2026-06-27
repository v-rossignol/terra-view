import { describe, expect, it } from 'vitest';
import type { UnitInstance } from '../../src/types/unit';
import { getUnitHexCoords, getUnitHexLocalPosition, applyUnitUpdate, getUnitsSourceSignature, groupUnitsByHex } from '@utils/unitLocation';

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

  it('extracts in-hex position from a planet unit location', () => {
    expect(getUnitHexLocalPosition(baseUnit())).toEqual({ x: 0.2, y: 0.4 });
  });

  it('defaults in-hex position to hex center when position is missing', () => {
    expect(
      getUnitHexLocalPosition(
        baseUnit({
          location: {
            cube: { id: 'cube-1' },
            starSystem: { id: 'system-1' },
            planet: {
              id: 'planet-1',
              hex_coords: { q: 2, r: 3 },
            },
          },
        }),
      ),
    ).toEqual({ x: 0.5, y: 0.5 });
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

  it('applies a UNIT_UPDATE payload to a matching unit', () => {
    const updatedLocation = {
      cube: { id: 'cube-1' },
      starSystem: { id: 'system-1' },
      planet: {
        id: 'planet-1',
        hex_coords: { q: 5, r: 6 },
        position: { x: 0.7, y: 0.3 },
      },
    };

    const units = [
      baseUnit({ id: 'unit-1' }),
      baseUnit({ id: 'unit-2', status: 'idle' }),
    ];

    const result = applyUnitUpdate(units, {
      unitId: 'unit-2',
      status: 'idle',
      location: updatedLocation,
    });

    expect(result[0]).toBe(units[0]);
    expect(result[1]).toMatchObject({
      id: 'unit-2',
      status: 'idle',
      location: updatedLocation,
    });
  });

  it('returns the same array when UNIT_UPDATE targets an unknown unit', () => {
    const units = [baseUnit()];

    expect(
      applyUnitUpdate(units, {
        unitId: 'missing-unit',
        status: 'idle',
        location: units[0].location,
      }),
    ).toBe(units);
  });

  it('builds a stable signature for source unit lists', () => {
    const units = [baseUnit(), baseUnit({ id: 'unit-2', status: 'moving', updatedAt: '2026-01-02T00:00:00.000Z' })];

    expect(getUnitsSourceSignature(units)).toBe(
      'unit-1:active:2026-01-01T00:00:00.000Z|unit-2:moving:2026-01-02T00:00:00.000Z',
    );
    expect(getUnitsSourceSignature([...units])).toBe(getUnitsSourceSignature(units));
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
