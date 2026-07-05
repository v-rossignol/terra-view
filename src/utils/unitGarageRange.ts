import { PLANET_GARAGE_RANGE_HEX } from '@infinity/shared-config';
import type { HexCoords } from '../types/planet';
import type { Vec2Local } from '../types/player';
import { computePlanetSurfaceTravelDistance, type PlanetSurfacePoint } from './planetSurfaceTravel';

export interface GarageRangePoint {
  hex: HexCoords;
  position: Vec2Local;
}

export function isWithinGarageRange(
  from: GarageRangePoint,
  to: GarageRangePoint,
  planetRadius: number,
): boolean {
  const fromPoint: PlanetSurfacePoint = { hex: from.hex, position: from.position };
  const toPoint: PlanetSurfacePoint = { hex: to.hex, position: to.position };
  const distance = computePlanetSurfaceTravelDistance(fromPoint, toPoint, planetRadius);

  return distance <= PLANET_GARAGE_RANGE_HEX;
}
