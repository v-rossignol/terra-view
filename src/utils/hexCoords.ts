import type { HexCoords } from '../types/planet';
import { getPlanetGridHeight } from './planetGrid';

export function parseHexCoord(value: string | undefined): number | null {
  if (value == null || value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function isHexInBounds(q: number, r: number, radius: number): boolean {
  return q >= 0 && q < radius && r >= 0 && r < getPlanetGridHeight(radius);
}

export function formatHexCoords(coords: HexCoords): string {
  return `(${coords.q}, ${coords.r})`;
}
