import {
  buildPlacementAnchorToBuildingZoneId,
  positionToBuildPlacementAnchor,
} from '@infinity/shared-utils';
import type { BuildingZoneId } from '@infinity/shared-config';
import { isSideBuildingZoneId } from '@infinity/shared-config';
import type { BiomeType, HexCoords, PlanetHexagon } from '../types/planet';
import type { UnitInstance } from '../types/unit';
import { getNeighborForSideZone } from './planetGrid';
import { getUnitHexCoords } from './unitLocation';
import { hasPlanetHex, isPlayerOnPlanet } from './playerLocation';

export function getUnitBuildingZoneId(unit: UnitInstance): BuildingZoneId | null {
  if (!isPlayerOnPlanet(unit.location) || !hasPlanetHex(unit.location)) {
    return null;
  }

  const storedZoneId = unit.location.planet.buildingZoneId;
  if (storedZoneId != null) {
    return storedZoneId;
  }

  if (unit.type.type !== 'building' || unit.location.planet.position == null) {
    return null;
  }

  const anchor = positionToBuildPlacementAnchor(unit.location.planet.position, 1);
  return buildPlacementAnchorToBuildingZoneId(anchor);
}

function findNeighborHex(
  neighbors: PlanetHexagon[],
  coords: HexCoords,
): PlanetHexagon | null {
  return (
    neighbors.find(
      (neighbor) =>
        neighbor.coordinates.q === coords.q && neighbor.coordinates.r === coords.r,
    ) ?? null
  );
}

export function resolveUnitExtractionBiomes(
  unit: UnitInstance,
  currentHex: PlanetHexagon,
  neighbors: PlanetHexagon[],
  planetRadius: number,
): BiomeType[] {
  const buildingZoneId = getUnitBuildingZoneId(unit);
  if (buildingZoneId == null || !isSideBuildingZoneId(buildingZoneId)) {
    return [currentHex.biome];
  }

  const hexCoords = getUnitHexCoords(unit);
  if (hexCoords == null) {
    return [currentHex.biome];
  }

  const neighborCoords = getNeighborForSideZone(
    hexCoords.q,
    hexCoords.r,
    buildingZoneId,
    planetRadius,
  );
  if (neighborCoords == null) {
    return [currentHex.biome];
  }

  const neighborHex = findNeighborHex(neighbors, neighborCoords);
  if (neighborHex == null || neighborHex.biome === currentHex.biome) {
    return [currentHex.biome];
  }

  return [currentHex.biome, neighborHex.biome];
}
