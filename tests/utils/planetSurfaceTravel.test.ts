import { describe, expect, it } from 'vitest';
import {
  computeMovementProgress,
  computeMovementWorldPosition,
  getToroidalSurfaceOffset,
  planetSurfaceToWorldPoint,
  worldPointToClusterScreen,
  worldPointToPlanetSurfacePoint,
} from '@utils/planetSurfaceTravel';
import { DEFAULT_HEX_LAYOUT } from '@utils/hexLayout';

describe('planetSurfaceTravel', () => {
  it('computes movement progress from startAt and arrivalAt', () => {
    const startAt = '2026-01-01T00:00:00.000Z';
    const arrivalAt = '2026-01-01T00:10:00.000Z';
    const midpoint = Date.parse('2026-01-01T00:05:00.000Z');

    expect(computeMovementProgress(startAt, arrivalAt, Date.parse(startAt))).toBe(0);
    expect(computeMovementProgress(startAt, arrivalAt, midpoint)).toBe(0.5);
    expect(computeMovementProgress(startAt, arrivalAt, Date.parse(arrivalAt))).toBe(1);
  });

  it('interpolates between origin and destination in world space', () => {
    const origin = { hex: { q: 0, r: 0 }, position: { x: 0, y: 0 } };
    const destination = { hex: { q: 0, r: 0 }, position: { x: 1, y: 1 } };

    expect(
      computeMovementWorldPosition(origin, destination, 0.5),
    ).toEqual(planetSurfaceToWorldPoint({ q: 0, r: 0 }, { x: 0.5, y: 0.5 }));
  });

  it('maps a world point back to its containing hex', () => {
    const surface = { hex: { q: 2, r: 3 }, position: { x: 0.35, y: 0.72 } };
    const world = planetSurfaceToWorldPoint(surface.hex, surface.position);
    const mapped = worldPointToPlanetSurfacePoint(world);

    expect(mapped.hex).toEqual(surface.hex);
    expect(mapped.position.x).toBeCloseTo(surface.position.x);
    expect(mapped.position.y).toBeCloseTo(surface.position.y);
  });

  it('uses toroidal wrapping for vertically adjacent hexes on a radius-13 planet', () => {
    const from = { hex: { q: 8, r: 0 }, position: { x: 0.5, y: 0.5 } };
    const to = { hex: { q: 8, r: 13 }, position: { x: 0.5, y: 0.5 } };
    const adjacent = { hex: { q: 8, r: 1 }, position: { x: 0.5, y: 0.5 } };
    const fromWorld = planetSurfaceToWorldPoint(from.hex, from.position);
    const toWorld = planetSurfaceToWorldPoint(to.hex, to.position);
    const adjacentWorld = planetSurfaceToWorldPoint(adjacent.hex, adjacent.position);

    const wrapOffset = getToroidalSurfaceOffset(fromWorld, toWorld, 13);
    const adjacentOffset = getToroidalSurfaceOffset(fromWorld, adjacentWorld, 13);

    expect(Math.hypot(wrapOffset.x, wrapOffset.y)).toBeCloseTo(
      Math.hypot(adjacentOffset.x, adjacentOffset.y),
      5,
    );
  });

  it('keeps toroidal destination screen offsets near the focus hex', () => {
    const from = { hex: { q: 8, r: 0 }, position: { x: 0.5, y: 0.5 } };
    const to = { hex: { q: 8, r: 13 }, position: { x: 0.5, y: 0.5 } };
    const destinationWorld = planetSurfaceToWorldPoint(to.hex, to.position);
    const clusterTopLeft = { x: 100, y: 100 };
    const destinationScreen = worldPointToClusterScreen(
      destinationWorld,
      from.hex,
      clusterTopLeft,
      13,
    );

    expect(Math.abs(destinationScreen.x - clusterTopLeft.x)).toBeLessThanOrEqual(80);
    expect(Math.abs(destinationScreen.y - clusterTopLeft.y)).toBeLessThan(80);
  });

  it('resolves toroidal arrival at (8, 13) instead of (9, 13) on a radius-13 planet', () => {
    const from = { hex: { q: 8, r: 0 }, position: { x: 0.5, y: 0.5 } };
    const to = { hex: { q: 8, r: 13 }, position: { x: 0.5, y: 0.5 } };
    const destinationWorld = planetSurfaceToWorldPoint(to.hex, to.position);

    expect(worldPointToPlanetSurfacePoint(destinationWorld, DEFAULT_HEX_LAYOUT, 13).hex).toEqual({
      q: 8,
      r: 13,
    });

    for (const progress of [0.95, 0.99, 1]) {
      const world = computeMovementWorldPosition(from, to, progress, 13);
      expect(worldPointToPlanetSurfacePoint(world, DEFAULT_HEX_LAYOUT, 13).hex).toEqual({
        q: 8,
        r: 13,
      });
    }
  });
});
