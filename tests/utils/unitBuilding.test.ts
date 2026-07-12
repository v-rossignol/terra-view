import { describe, expect, it } from 'vitest';
import {
  computeBuildProgressPercent,
  constructionSitesForHex,
  listOwnConstructionSites,
  parseBuildingMetadata,
} from '../../src/utils/unitBuilding';
import type { UnitInstance } from '../../src/types/unit';

const builderUnit: UnitInstance = {
  id: 'builder-1',
  typeId: 'scout-x1',
  ownerId: 'player-1',
  location: {
    cube: { id: 'cube-1' },
    starSystem: { id: 'system-1' },
    planet: {
      id: 'planet-1',
      hex_coords: { q: 1, r: 1 },
      position: { x: 0.2, y: 0.2 },
    },
  },
  status: 'building',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  metadata: {
    building: {
      targetTypeId: 'sawmill',
      planetId: 'planet-1',
      hexCoords: { q: 2, r: 3 },
      buildingZoneId: 'central-1-1',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:01:40.000Z',
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
    rules: [{ range: 'hexagon', value: 1 }],
    capabilities: {},
    description: null,
    metadata: {},
  },
};

describe('parseBuildingMetadata', () => {
  it('returns parsed building metadata', () => {
    expect(parseBuildingMetadata(builderUnit.metadata)).toEqual({
      targetTypeId: 'sawmill',
      planetId: 'planet-1',
      hexCoords: { q: 2, r: 3 },
      buildingZoneId: 'central-1-1',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:01:40.000Z',
    });
  });

  it('returns null when building metadata is missing', () => {
    expect(parseBuildingMetadata({})).toBeNull();
  });
});

describe('computeBuildProgressPercent', () => {
  it('returns 0 at start', () => {
    expect(
      computeBuildProgressPercent(
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:01:40.000Z',
        Date.parse('2026-01-01T00:00:00.000Z'),
      ),
    ).toBe(0);
  });

  it('returns integer percent during build', () => {
    expect(
      computeBuildProgressPercent(
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:01:40.000Z',
        Date.parse('2026-01-01T00:00:50.000Z'),
      ),
    ).toBe(50);
  });

  it('caps at 100 after completion time', () => {
    expect(
      computeBuildProgressPercent(
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:01:40.000Z',
        Date.parse('2026-01-01T00:02:00.000Z'),
      ),
    ).toBe(100);
  });
});

describe('listOwnConstructionSites', () => {
  it('returns construction sites for owned building units only', () => {
    const otherPlayerUnit = {
      ...builderUnit,
      id: 'builder-2',
      ownerId: 'player-2',
    };

    const sites = listOwnConstructionSites([builderUnit, otherPlayerUnit], 'player-1');

    expect(sites).toHaveLength(1);
    expect(sites[0]).toMatchObject({
      builderUnitId: 'builder-1',
      targetTypeId: 'sawmill',
      targetName: 'Sawmill',
      footprintCells: 1,
      hexCoords: { q: 2, r: 3 },
    });
  });

  it('filters sites by hex coordinates', () => {
    const sites = listOwnConstructionSites([builderUnit], 'player-1');

    expect(constructionSitesForHex(sites, { q: 2, r: 3 })).toHaveLength(1);
    expect(constructionSitesForHex(sites, { q: 1, r: 1 })).toHaveLength(0);
  });
});
