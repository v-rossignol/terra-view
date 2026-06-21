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

/** Toroidal neighbors — matches server `getNeighbors` (game logic). */
export function getHexNeighbors(q: number, r: number, radius: number): HexCoords[] {
  const width = radius;
  const height = getPlanetGridHeight(radius);

  return [
    { q: (q - 1 + width) % width, r: (r + 1) % height },
    { q, r: (r + 1) % height },
    { q: (q + 1) % width, r },
    { q: (q + 1) % width, r: (r - 1 + height) % height },
    { q, r: (r - 1 + height) % height },
    { q: (q - 1 + width) % width, r },
  ];
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

  const maxDistance = getMaxAdjacentHexCenterDistance(layout);

  return hexagons
    .filter(
      (cell) => cell.coordinates.q !== focus.q || cell.coordinates.r !== focus.r,
    )
    .map((cell) => ({
      cell,
      distance: getHexCenterDistance(focus, cell.coordinates, layout, radius),
    }))
    .filter(({ distance }) => distance <= maxDistance)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 6)
    .map(({ cell }) => cell);
}

/** Random spawn hex within planet bounds — matches server `rollRandomPosition`. */
export function rollRandomHex(radius: number): HexCoords {
  return {
    q: Math.floor(Math.random() * radius),
    r: Math.floor(Math.random() * getPlanetGridHeight(radius)),
  };
}
