import { describe, expect, it } from 'vitest';
import {
  findNeighborHexagons,
  findVisualNeighborHexagons,
  findVisualOuterNeighborHexagons,
  getHexNeighbors,
  getHexOuterNeighbors,
  getPlanetGridHeight,
  rollRandomHex,
} from '@utils/planetGrid';
import type { PlanetHexagon } from '../../src/types/planet';

function makeHex(q: number, r: number, biome: PlanetHexagon['biome'] = 'forest'): PlanetHexagon {
  return {
    biome,
    resources: [],
    dangerLevel: 0,
    coordinates: { q, r },
  };
}

function buildSurface(radius: number): PlanetHexagon[] {
  const hexagons: PlanetHexagon[] = [];
  const height = getPlanetGridHeight(radius);

  for (let r = 0; r < height; r += 1) {
    for (let q = 0; q < radius; q += 1) {
      hexagons.push(makeHex(q, r));
    }
  }

  return hexagons;
}

describe('planetGrid', () => {
  it('computes grid height as radius + 1', () => {
    expect(getPlanetGridHeight(5)).toBe(6);
  });

  it('rolls hex coordinates within planet bounds', () => {
    const radius = 8;
    const hex = rollRandomHex(radius);

    expect(hex.q).toBeGreaterThanOrEqual(0);
    expect(hex.q).toBeLessThan(radius);
    expect(hex.r).toBeGreaterThanOrEqual(0);
    expect(hex.r).toBeLessThan(getPlanetGridHeight(radius));
  });

  it('returns six rendered-surface neighbors', () => {
    expect(getHexNeighbors(2, 3, 10)).toEqual([
      { q: 2, r: 2 },
      { q: 3, r: 2 },
      { q: 2, r: 4 },
      { q: 3, r: 4 },
      { q: 1, r: 3 },
      { q: 3, r: 3 },
    ]);
  });

  it('wraps neighbors at grid edges using rendered adjacency', () => {
    expect(getHexNeighbors(0, 0, 5)).toContainEqual({ q: 4, r: 0 });
    expect(getHexNeighbors(4, 5, 5)).toContainEqual({ q: 0, r: 5 });
  });

  it('matches hex view south wrap from (8, 13) on radius 13', () => {
    const neighbors = getHexNeighbors(8, 13, 13);

    expect(neighbors).toContainEqual({ q: 8, r: 0 });
    expect(neighbors).toContainEqual({ q: 9, r: 0 });
    expect(neighbors).not.toContainEqual({ q: 7, r: 0 });
  });

  it('finds rendered neighbor hexagons from planet surface data', () => {
    const hexagons: PlanetHexagon[] = [makeHex(2, 3), makeHex(2, 4, 'ocean')];

    expect(findNeighborHexagons(hexagons, { q: 2, r: 3 }, 10)).toEqual([hexagons[1]]);
  });

  it('finds six visual neighbors for hex (5, 6), including (4, 5)', () => {
    const surface = buildSurface(10);
    const neighbors = findVisualNeighborHexagons(surface, { q: 5, r: 6 }, 10);
    const coords = neighbors.map((cell) => cell.coordinates);

    expect(neighbors).toHaveLength(6);
    expect(coords).toContainEqual({ q: 4, r: 5 });
    expect(coords).not.toContainEqual({ q: 6, r: 5 });
  });

  it('returns outer neighbors two steps from the focus hex', () => {
    expect(getHexOuterNeighbors(2, 3, 10)).toContainEqual({ q: 1, r: 2 });
    expect(getHexOuterNeighbors(2, 3, 10)).not.toContainEqual({ q: 2, r: 3 });
    expect(getHexOuterNeighbors(2, 3, 10)).not.toContainEqual({ q: 2, r: 4 });
  });

  it('finds outer neighbor hexagons from planet surface data', () => {
    const surface = buildSurface(10);
    const outerNeighbors = findVisualOuterNeighborHexagons(surface, { q: 5, r: 6 }, 10);

    expect(outerNeighbors.length).toBeGreaterThan(0);
    expect(outerNeighbors.map((cell) => cell.coordinates)).not.toContainEqual({ q: 5, r: 6 });
    expect(outerNeighbors.map((cell) => cell.coordinates)).not.toContainEqual({ q: 4, r: 5 });
  });
});
