import { PLANET_EXTRACTION_TICK_MS } from '@infinity/shared-config';
import { describe, expect, it } from 'vitest';
import type { PlanetHexResources } from '../../src/types/resource';
import type { UnitInstance } from '../../src/types/unit';
import {
  buildHexResourcesByCoords,
  computeProjectedExtractionCargo,
  getHexResourceYieldQuantity,
  parseUnitExtractionMetadata,
  resolveResourceExtractionHex,
  resolveUnitExtractionHexCoords,
  withProjectedExtractionCargo,
} from '../../src/utils/unitExtraction';

const focusHexResources: PlanetHexResources = {
  planetId: 'planet-1',
  coordinates: { q: 2, r: 3 },
  biome: 'forest',
  resources: [
    { type: 'wood', abundance: 10, rarity: 'common' },
    { type: 'food', abundance: 5, rarity: 'common' },
  ],
};

const neighborHexResources: PlanetHexResources = {
  planetId: 'planet-1',
  coordinates: { q: 3, r: 3 },
  biome: 'ocean',
  resources: [{ type: 'salt-water', abundance: 100, rarity: 'common' }],
};

const hexResourcesByCoords = buildHexResourcesByCoords([
  focusHexResources,
  neighborHexResources,
]);

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

  it('resolves yield quantity for the extraction hex', () => {
    expect(getHexResourceYieldQuantity(hexResourcesByCoords, { q: 2, r: 3 }, 'wood')).toBe(50);
    expect(getHexResourceYieldQuantity(hexResourcesByCoords, { q: 3, r: 3 }, 'salt-water')).toBe(
      100,
    );
    expect(getHexResourceYieldQuantity(hexResourcesByCoords, { q: 0, r: 0 }, 'wood')).toBeNull();
  });

  it('resolves extraction hex coords for a side-zone building', () => {
    const dock = extractingUnit({
      typeId: 'dock',
      location: {
        cube: { id: 'cube-1' },
        starSystem: { id: 'system-1' },
        planet: {
          id: 'planet-1',
          hex_coords: { q: 2, r: 3 },
          position: { x: 1, y: 0.5 },
          buildingZoneId: 'right',
        },
      },
    });

    expect(resolveUnitExtractionHexCoords(dock, 10)).toEqual([
      { q: 2, r: 3 },
      { q: 3, r: 3 },
    ]);
  });

  it('resolves neighbor hex for side-zone extraction resources', () => {
    expect(
      resolveResourceExtractionHex(
        [
          { q: 2, r: 3 },
          { q: 3, r: 3 },
        ],
        hexResourcesByCoords,
        'salt-water',
      ),
    ).toEqual({ q: 3, r: 3 });
  });

  it('projects cargo from extraction speed and elapsed time', () => {
    const unit = extractingUnit();
    const lastTickAt = Date.parse('2026-01-01T00:00:00.000Z');

    expect(
      computeProjectedExtractionCargo(unit, 10, lastTickAt + PLANET_EXTRACTION_TICK_MS / 2),
    ).toEqual({ wood: 5 });
  });

  it('projects cargo for extraction on a neighbor hex', () => {
    const unit = extractingUnit({
      metadata: {
        extraction: {
          resourceType: 'salt-water',
          planetId: 'planet-1',
          hexCoords: { q: 3, r: 3 },
          startedAt: '2026-01-01T00:00:00.000Z',
          lastTickAt: '2026-01-01T00:00:00.000Z',
        },
      },
      type: {
        ...extractingUnit().type,
        capabilities: {
          extraction: { speed: 1, types: ['salt-water'] },
          cargo: { size: 1000 },
        },
      },
    });
    const lastTickAt = Date.parse('2026-01-01T00:00:00.000Z');

    expect(
      withProjectedExtractionCargo(
        unit,
        hexResourcesByCoords,
        lastTickAt + PLANET_EXTRACTION_TICK_MS,
      ).cargo,
    ).toEqual({ 'salt-water': 100 });
  });

  it('returns the same unit when no yield quantity is available', () => {
    const unit = extractingUnit();

    expect(withProjectedExtractionCargo(unit, null, Date.now())).toBe(unit);
  });
});
