import type { HexCoords } from '../types/planet';

/** Toroidal grid height — matches server `getPlanetGridHeight`. */
export function getPlanetGridHeight(radius: number): number {
  return radius + 1;
}

/** Random spawn hex within planet bounds — matches server `rollRandomPosition`. */
export function rollRandomHex(radius: number): HexCoords {
  return {
    q: Math.floor(Math.random() * radius),
    r: Math.floor(Math.random() * getPlanetGridHeight(radius)),
  };
}
