import type { HexCoords } from '../types/planet';
import { getHexNeighbors } from './planetGrid';

export interface HexWithBiome {
  coordinates: HexCoords;
  biome: string;
}

export function isBiomeAllowedForUnit(biome: string, environments: readonly string[]): boolean {
  return environments.includes(biome);
}

export function getBiomeForHex(
  hexes: ReadonlyArray<HexWithBiome>,
  coords: HexCoords,
): string | undefined {
  return hexes.find(
    (hex) => hex.coordinates.q === coords.q && hex.coordinates.r === coords.r,
  )?.biome;
}

export function getValidMoveDestinationHexes(origin: HexCoords, radius: number): HexCoords[] {
  return [origin, ...getHexNeighbors(origin.q, origin.r, radius)];
}

export function isBiomeAllowedMoveDestination(
  origin: HexCoords,
  candidate: HexCoords,
  environments: readonly string[],
  hexes: ReadonlyArray<HexWithBiome>,
): boolean {
  if (candidate.q === origin.q && candidate.r === origin.r) {
    return true;
  }

  const biome = getBiomeForHex(hexes, candidate);
  if (biome == null) {
    return false;
  }

  return isBiomeAllowedForUnit(biome, environments);
}

export function getBiomeAllowedMoveDestinationHexes(
  origin: HexCoords,
  radius: number,
  hexes: ReadonlyArray<HexWithBiome>,
  environments: readonly string[],
): HexCoords[] {
  return getValidMoveDestinationHexes(origin, radius).filter((candidate) =>
    isBiomeAllowedMoveDestination(origin, candidate, environments, hexes),
  );
}

export function isValidMoveDestinationHex(
  origin: HexCoords,
  candidate: HexCoords,
  radius: number,
): boolean {
  if (candidate.q === origin.q && candidate.r === origin.r) {
    return true;
  }

  return getHexNeighbors(origin.q, origin.r, radius).some(
    (neighbor) => neighbor.q === candidate.q && neighbor.r === candidate.r,
  );
}

export function hexCoordsKey(coords: HexCoords): string {
  return `${coords.q},${coords.r}`;
}
