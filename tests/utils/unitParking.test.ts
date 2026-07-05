import { describe, expect, it } from 'vitest';
import type { UnitInstance } from '../../src/types/unit';
import { countParkedInGarage, findParkableGarages } from '../../src/utils/unitParking';

const playerId = 'player-1';
const planetRadius = 10;

const baseLocation = {
  cube: { id: 'cube-1' },
  starSystem: { id: 'system-1' },
  planet: {
    id: 'planet-1',
    hex_coords: { q: 2, r: 3 },
    position: { x: 0.5, y: 0.5 },
  },
};

function buildVehicle(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: 'scout-1',
    typeId: 'scout-x1',
    ownerId: playerId,
    location: baseLocation,
    status: 'idle',
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
      rules: [],
      capabilities: {},
      description: null,
      metadata: {},
    },
    ...overrides,
  };
}

function buildGarage(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: 'sawmill-1',
    typeId: 'sawmill',
    ownerId: playerId,
    location: {
      ...baseLocation,
      planet: {
        ...baseLocation.planet,
        position: { x: 0.51, y: 0.5 },
      },
    },
    status: 'idle',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    metadata: {},
    cargo: {},
    garage: {},
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

describe('unitParking', () => {
  it('finds a nearby garage for an idle vehicle', () => {
    const vehicle = buildVehicle();
    const garage = buildGarage();

    expect(findParkableGarages(vehicle, [vehicle, garage], planetRadius, playerId)).toEqual([
      { unitId: 'sawmill-1', name: 'Sawmill' },
    ]);
  });

  it('returns empty when vehicle is too far from garage', () => {
    const vehicle = buildVehicle();
    const garage = buildGarage({
      location: {
        ...baseLocation,
        planet: {
          ...baseLocation.planet,
          position: { x: 0.1, y: 0.5 },
        },
      },
    });

    expect(findParkableGarages(vehicle, [vehicle, garage], planetRadius, playerId)).toEqual([]);
  });

  it('returns empty when garage is full for the vehicle size', () => {
    const vehicle = buildVehicle({ id: 'scout-2' });
    const garage = buildGarage();
    const parked = buildVehicle({
      id: 'scout-parked',
      status: 'inactive',
      metadata: {
        parking: {
          garageUnitId: 'sawmill-1',
          parkedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    });

    expect(findParkableGarages(vehicle, [vehicle, garage, parked], planetRadius, playerId)).toEqual(
      [],
    );
  });

  it('counts parked vehicles in a garage by size', () => {
    const parked = buildVehicle({
      id: 'scout-parked',
      status: 'inactive',
      metadata: {
        parking: {
          garageUnitId: 'sawmill-1',
          parkedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    });

    expect(countParkedInGarage([parked], 'sawmill-1', 'small')).toBe(1);
    expect(countParkedInGarage([parked], 'sawmill-1', 'medium')).toBe(0);
  });
});
