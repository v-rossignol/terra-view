import { describe, expect, it } from 'vitest';
import type { UnitInstance } from '../../src/types/unit';
import { listGarageVehicles, summarizeGarageSlots } from '../../src/utils/unitGarage';

function buildGarage(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: 'sawmill-1',
    typeId: 'sawmill',
    ownerId: 'player-1',
    location: {
      cube: { id: 'cube-1' },
      starSystem: { id: 'system-1' },
      planet: {
        id: 'planet-1',
        hex_coords: { q: 2, r: 3 },
        position: { x: 0.5, y: 0.5 },
      },
    },
    status: 'idle',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    metadata: {},
    cargo: {},
    garage: {
      'scout-parked': { id: 'scout-parked', typeId: 'scout-x1' },
    },
    type: {
      id: 'sawmill',
      name: 'Sawmill',
      type: 'building',
      size: 'small',
      mobility: false,
      speed: null,
      environments: ['forest'],
      rules: [],
      capabilities: {
        garage: { small: 1, medium: 0, large: 0 },
      },
      description: null,
      metadata: {},
    },
    ...overrides,
  };
}

function buildParkedVehicle(): UnitInstance {
  return {
    id: 'scout-parked',
    typeId: 'scout-x1',
    ownerId: 'player-1',
    location: {
      cube: { id: 'cube-1' },
      starSystem: { id: 'system-1' },
      planet: {
        id: 'planet-1',
        hex_coords: { q: 2, r: 3 },
        position: { x: 0.5, y: 0.5 },
      },
    },
    status: 'inactive',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    metadata: {
      parking: {
        garageUnitId: 'sawmill-1',
        parkedAt: '2026-01-01T00:00:00.000Z',
      },
    },
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
      rules: [],
      capabilities: {},
      description: null,
      metadata: {},
    },
  };
}

describe('unitGarage', () => {
  it('lists parked vehicles with resolved names and sizes', () => {
    const garage = buildGarage();
    const parked = buildParkedVehicle();

    expect(listGarageVehicles(garage, [garage, parked])).toEqual([
      {
        id: 'scout-parked',
        typeId: 'scout-x1',
        name: 'Scout-X1',
        size: 'small',
      },
    ]);
  });

  it('summarizes garage slot usage by size', () => {
    const garage = buildGarage();
    const parked = buildParkedVehicle();

    expect(summarizeGarageSlots(garage, [garage, parked])).toEqual([
      { size: 'small', used: 1, capacity: 1 },
    ]);
  });
});
