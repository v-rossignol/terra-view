import { PLANET_EXTRACTION_TICK_MS } from '@infinity/shared-config';
import { describe, expect, it } from 'vitest';
import type { PlanetHexResources } from '../../src/types/resource';
import type { UnitInstance } from '../../src/types/unit';
import {
  computeProjectedExtractionCargo,
  getHexResourceAbundance,
  parseUnitExtractionMetadata,
  withProjectedExtractionCargo,
} from '../../src/utils/unitExtraction';

const hexResources: PlanetHexResources = {
  planetId: 'planet-1',
  coordinates: { q: 2, r: 3 },
  biome: 'forest',
  resources: [{ type: 'wood', abundance: 10, rarity: 'common' }],
};

const extractingUnit = (overrides: Partial<UnitInstance> = {}): UnitInstance => ({
  id: 'unit-1',
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
  status: 'extracting',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  metadata: {
    extraction: {
      resourceType: 'wood',
      planetId: 'planet-1',
      hexCoords: { q: 2, r: 3 },
      startedAt: '2026-01-01T00:00:00.000Z',
      lastTickAt: '2026-01-01T00:00:00.000Z',
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
    capabilities: {
      extraction: { speed: 1, types: ['wood'] },
      cargo: { size: 20 },
    },
    description: null,
    metadata: {},
  },
  ...overrides,
});

describe('unitExtraction', () => {
  it('parses valid extraction metadata', () => {
    expect(parseUnitExtractionMetadata(extractingUnit().metadata)).toEqual({
      resourceType: 'wood',
      planetId: 'planet-1',
      hexCoords: { q: 2, r: 3 },
      startedAt: '2026-01-01T00:00:00.000Z',
      lastTickAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('returns null for invalid extraction metadata', () => {
    expect(parseUnitExtractionMetadata({ extraction: { resourceType: 'wood' } })).toBeNull();
  });

  it('resolves resource abundance for the current hex', () => {
    expect(getHexResourceAbundance(hexResources, { q: 2, r: 3 }, 'wood')).toBe(10);
    expect(getHexResourceAbundance(hexResources, { q: 0, r: 0 }, 'wood')).toBeNull();
  });

  it('projects cargo from extraction speed and elapsed time', () => {
    const unit = extractingUnit();
    const lastTickAt = Date.parse('2026-01-01T00:00:00.000Z');
    const halfTickMs = PLANET_EXTRACTION_TICK_MS / 2;

    expect(
      computeProjectedExtractionCargo(unit, 10, lastTickAt + halfTickMs),
    ).toEqual({ wood: 5 });
  });

  it('returns the same unit when no abundance is available', () => {
    const unit = extractingUnit();

    expect(withProjectedExtractionCargo(unit, null, Date.now())).toBe(unit);
  });
});
