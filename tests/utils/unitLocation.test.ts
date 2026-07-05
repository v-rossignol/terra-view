import { describe, expect, it } from 'vitest';
import type { UnitInstance } from '../../src/types/unit';
import { getUnitHexCoords, getUnitHexLocalPosition, applyUnitUpdate, getUnitsSourceSignature, groupUnitsByHex } from '@utils/unitLocation';
import { parseUnitExtractionMetadata } from '@utils/unitExtraction';

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
  cargo: {},
  garage: {},
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

  it('merges cargo from UNIT_UPDATE when present', () => {
    const units = [baseUnit({ cargo: { iron: 2 } })];

    const result = applyUnitUpdate(units, {
      unitId: 'unit-1',
      status: 'extracting',
      location: units[0].location,
      cargo: { iron: 5 },
    });

    expect(result[0].cargo).toEqual({ iron: 5 });
    expect(result[0].status).toBe('extracting');
  });

  it('merges metadata from UNIT_UPDATE when present', () => {
    const units = [baseUnit()];

    const result = applyUnitUpdate(units, {
      unitId: 'unit-1',
      status: 'extracting',
      location: units[0].location,
      metadata: {
        extraction: {
          resourceType: 'wood',
          planetId: 'planet-1',
          hexCoords: { q: 2, r: 3 },
          startedAt: '2026-01-01T00:00:00.000Z',
          lastTickAt: '2026-01-01T00:00:00.000Z',
        },
      },
    });

    expect(parseUnitExtractionMetadata(result[0].metadata)?.resourceType).toBe('wood');
  });

  it('clears extraction metadata when status becomes idle', () => {
    const units = [
      baseUnit({
        status: 'extracting',
        metadata: {
          extraction: {
            resourceType: 'wood',
            planetId: 'planet-1',
            hexCoords: { q: 2, r: 3 },
            startedAt: '2026-01-01T00:00:00.000Z',
            lastTickAt: '2026-01-01T00:00:00.000Z',
          },
        },
      }),
    ];

    const result = applyUnitUpdate(units, {
      unitId: 'unit-1',
      status: 'idle',
      location: units[0].location,
      cargo: { wood: 4 },
    });

    expect(result[0].metadata).toEqual({});
  });

  it('preserves existing cargo when UNIT_UPDATE omits cargo', () => {
    const units = [baseUnit({ cargo: { iron: 2 } })];

    const result = applyUnitUpdate(units, {
      unitId: 'unit-1',
      status: 'idle',
      location: units[0].location,
    });

    expect(result[0].cargo).toEqual({ iron: 2 });
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

  it('groups active units by hex and skips destroyed and parked vehicles', () => {
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
      baseUnit({
        id: 'unit-4',
        status: 'inactive',
        metadata: {
          parking: {
            garageUnitId: 'sawmill-1',
            parkedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      }),
    ]);

    expect(grouped.get('2,3')).toHaveLength(2);
    expect(grouped.has('4,1')).toBe(false);
  });

  it('merges garage updates from socket payloads', () => {
    const garagePayload = {
      'scout-parked': { id: 'scout-parked', typeId: 'scout-x1' },
    };

    expect(
      applyUnitUpdate([baseUnit({ garage: {} })], {
        unitId: 'unit-1',
        status: 'active',
        location: baseUnit().location,
        garage: garagePayload,
      }),
    ).toEqual([baseUnit({ garage: garagePayload })]);
  });
});
