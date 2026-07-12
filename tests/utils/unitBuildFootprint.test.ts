import { describe, expect, it } from 'vitest';
import type { UnitInstance } from '../../src/types/unit';
import { isPointOnBuildingFootprint } from '../../src/utils/unitBuildFootprint';

const sawmill: UnitInstance = {
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
    capabilities: {},
    description: null,
    metadata: {},
  },
};

describe('unitBuildFootprint', () => {
  it('detects points inside a building footprint', () => {
    expect(isPointOnBuildingFootprint({ x: 0.5, y: 0.5 }, [sawmill])).toBe(true);
    expect(isPointOnBuildingFootprint({ x: 0.1, y: 0.1 }, [sawmill])).toBe(false);
  });
});
