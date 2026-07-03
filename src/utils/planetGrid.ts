import type { HexCoords, PlanetHexagon } from '../types/planet';
import {
  DEFAULT_HEX_LAYOUT,
  getHexCenterDistance,
  getMaxAdjacentHexCenterDistance,
  type HexLayoutConfig,
} from './hexLayout';

/** Toroidal grid height — matches server `getPlanetGridHeight`. */
export function getPlanetGridHeight(radius: number): number {
  return radius + 1;
}

/**
 * Hexes adjacent to `(q, r)` on the rendered toroidal surface.
 * Matches hex view (`findVisualNeighborHexagons`) and server `getNeighbors`.
 */
export function getHexNeighbors(
  q: number,
  r: number,
  radius: number,
  layout: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): HexCoords[] {
  const width = radius;
  const height = getPlanetGridHeight(radius);
  const focus = { q, r };
  const maxDistance = getMaxAdjacentHexCenterDistance(layout);
  const candidates: Array<{ coords: HexCoords; distance: number }> = [];

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (col === q && row === r) {
        continue;
      }

      const coords = { q: col, r: row };
      const distance = getHexCenterDistance(focus, coords, layout, radius);
      if (distance <= maxDistance) {
        candidates.push({ coords, distance });
      }
    }
  }

  return candidates
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 6)
    .map(({ coords }) => coords);
}

export function findNeighborHexagons(
  hexagons: PlanetHexagon[] | undefined,
  focus: HexCoords,
  radius: number,
): PlanetHexagon[] {
  if (hexagons == null) {
    return [];
  }

  return getHexNeighbors(focus.q, focus.r, radius)
    .map((coords) =>
      hexagons.find(
        (cell) => cell.coordinates.q === coords.q && cell.coordinates.r === coords.r,
      ),
    )
    .filter((cell): cell is PlanetHexagon => cell != null);
}

/** Hexes whose rendered tiles touch the focus cell on screen. */
export function findVisualNeighborHexagons(
  hexagons: PlanetHexagon[] | undefined,
  focus: HexCoords,
  radius: number,
  layout: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): PlanetHexagon[] {
  if (hexagons == null) {
    return [];
  }

  return getHexNeighbors(focus.q, focus.r, radius, layout)
    .map((coords) =>
      hexagons.find(
        (cell) => cell.coordinates.q === coords.q && cell.coordinates.r === coords.r,
      ),
    )
    .filter((cell): cell is PlanetHexagon => cell != null);
}

/** Random spawn hex within planet bounds — matches server `rollRandomPosition`. */
export function rollRandomHex(radius: number): HexCoords {
  return {
    q: Math.floor(Math.random() * radius),
    r: Math.floor(Math.random() * getPlanetGridHeight(radius)),
  };
}
