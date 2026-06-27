import { describe, expect, it } from 'vitest';
import type { UnitInstance } from '../../src/types/unit';
import {
  buildMovementTrackFromUnit,
  getFollowHexForSelectedMovingUnit,
  isMovementVisibleInCluster,
  movementTrackFromMoveOrder,
  parseUnitMovementMetadata,
  resolveUnitMovementTrack,
} from '@utils/unitMovementTrack';

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
  status: 'moving',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  metadata: {
    movement: {
      targetHex: { q: 2, r: 4 },
      targetPosition: { x: 0.6, y: 0.7 },
      startedAt: '2026-01-01T00:00:00.000Z',
      arrivalAt: '2026-01-01T00:05:00.000Z',
    },
  },
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

describe('unitMovementTrack', () => {
  it('parses server movement metadata', () => {
    expect(parseUnitMovementMetadata(baseUnit().metadata)).toEqual({
      targetHex: { q: 2, r: 4 },
      targetPosition: { x: 0.6, y: 0.7 },
      startedAt: '2026-01-01T00:00:00.000Z',
      arrivalAt: '2026-01-01T00:05:00.000Z',
    });
  });

  it('builds a movement track from a moving unit', () => {
    expect(buildMovementTrackFromUnit(baseUnit())).toEqual({
      startAt: '2026-01-01T00:00:00.000Z',
      arrivalAt: '2026-01-01T00:05:00.000Z',
      origin: { hex: { q: 2, r: 3 }, position: { x: 0.2, y: 0.4 } },
      destination: { hex: { q: 2, r: 4 }, position: { x: 0.6, y: 0.7 } },
    });
  });

  it('prefers a client track from the move response', () => {
    const clientTrack = movementTrackFromMoveOrder({
      unitId: 'unit-1',
      status: 'moving',
      startAt: '2026-01-01T00:01:00.000Z',
      arrivalAt: '2026-01-01T00:06:00.000Z',
      origin: { hex: { q: 2, r: 3 }, position: { x: 0.35, y: 0.72 } },
      destination: { hex: { q: 2, r: 4 }, position: { x: 0.4, y: 0.6 } },
      distance: 0.739,
    });

    expect(resolveUnitMovementTrack(baseUnit(), { 'unit-1': clientTrack })).toEqual(clientTrack);
  });

  it('checks whether a movement path intersects the visible cluster', () => {
    const track = buildMovementTrackFromUnit(baseUnit())!;
    const visible = new Set(['2,3', '2,4']);

    expect(isMovementVisibleInCluster(track, visible)).toBe(true);
    expect(isMovementVisibleInCluster(track, new Set(['5,5']))).toBe(false);
  });

  it('returns a follow hex when the selected unit crosses into another hex', () => {
    const track = movementTrackFromMoveOrder({
      unitId: 'unit-1',
      status: 'moving',
      startAt: '2026-01-01T00:00:00.000Z',
      arrivalAt: '2026-01-01T00:10:00.000Z',
      origin: { hex: { q: 2, r: 3 }, position: { x: 0.35, y: 0.72 } },
      destination: { hex: { q: 2, r: 4 }, position: { x: 0.4, y: 0.6 } },
      distance: 0.739,
    });
    const midpoint = Date.parse('2026-01-01T00:05:00.000Z');

    expect(
      getFollowHexForSelectedMovingUnit(baseUnit(), { 'unit-1': track }, { q: 2, r: 3 }, midpoint),
    ).toEqual({ q: 2, r: 4 });
    expect(
      getFollowHexForSelectedMovingUnit(baseUnit(), { 'unit-1': track }, { q: 2, r: 4 }, midpoint),
    ).toBeNull();
  });
});
