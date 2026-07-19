import { isSideBuildingZoneId, PLANET_EXTRACTION_TICK_MS } from '@infinity/shared-config';
import {
  addYieldToCargo,
  clampYieldToCargoCapacity,
  computeExtractionYield,
  type UnitCargo,
} from '@infinity/shared-utils';
import type { HexCoords } from '../types/planet';
import type { PlanetHexResources } from '../types/resource';
import type { UnitInstance } from '../types/unit';
import { getPermanentBiomeResources } from './biomeResources';
import { getNeighborForSideZone } from './planetGrid';
import { getUnitHexCoords } from './unitLocation';
import { getUnitBuildingZoneId } from './unitExtractionBiomes';
import { hexCoordsKey } from './unitMovement';

export type HexResourcesByCoords = Readonly<Record<string, PlanetHexResources>>;

export interface UnitExtractionMetadata {
  resourceType: string;
  planetId: string;
  hexCoords: HexCoords;
  startedAt: string;
  lastTickAt: string;
}

export function parseUnitExtractionMetadata(
  metadata: Record<string, unknown>,
): UnitExtractionMetadata | null {
  const raw = metadata.extraction;
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const extraction = raw as Record<string, unknown>;
  const hexCoords = extraction.hexCoords;
  if (
    typeof extraction.resourceType !== 'string' ||
    typeof extraction.planetId !== 'string' ||
    typeof extraction.startedAt !== 'string' ||
    typeof extraction.lastTickAt !== 'string' ||
    hexCoords == null ||
    typeof hexCoords !== 'object' ||
    typeof (hexCoords as Record<string, unknown>).q !== 'number' ||
    typeof (hexCoords as Record<string, unknown>).r !== 'number'
  ) {
    return null;
  }

  return {
    resourceType: extraction.resourceType,
    planetId: extraction.planetId,
    hexCoords: hexCoords as HexCoords,
    startedAt: extraction.startedAt,
    lastTickAt: extraction.lastTickAt,
  };
}

export function resolveUnitExtractionHexCoords(
  unit: UnitInstance,
  planetRadius: number,
): HexCoords[] {
  const hexCoords = getUnitHexCoords(unit);
  if (hexCoords == null) {
    return [];
  }

  const buildingZoneId = getUnitBuildingZoneId(unit);
  if (buildingZoneId == null || !isSideBuildingZoneId(buildingZoneId)) {
    return [hexCoords];
  }

  const neighborCoords = getNeighborForSideZone(
    hexCoords.q,
    hexCoords.r,
    buildingZoneId,
    planetRadius,
  );
  if (neighborCoords == null) {
    return [hexCoords];
  }

  return [hexCoords, neighborCoords];
}

export function resolveResourceExtractionHex(
  extractionHexCoords: readonly HexCoords[],
  hexResourcesByCoords: HexResourcesByCoords | null,
  resourceType: string,
): HexCoords | null {
  if (hexResourcesByCoords == null) {
    return extractionHexCoords[0] ?? null;
  }

  let bestMatch: { hexCoords: HexCoords; quantity: number } | null = null;

  for (const hexCoords of extractionHexCoords) {
    const hexResources = hexResourcesByCoords[hexCoordsKey(hexCoords)];
    if (hexResources == null) {
      continue;
    }

    const resourceInHex = hexResources.resources.some(
      (resource) => resource.type === resourceType,
    );
    if (!resourceInHex) {
      continue;
    }

    const biomeQuantity = getPermanentBiomeResources(hexResources.biome).find(
      (resource) => resource.id === resourceType,
    )?.quantity;
    if (biomeQuantity == null) {
      continue;
    }

    if (bestMatch == null || biomeQuantity > bestMatch.quantity) {
      bestMatch = { hexCoords, quantity: biomeQuantity };
    }
  }

  return bestMatch?.hexCoords ?? null;
}

export function getHexResourceYieldQuantity(
  hexResourcesByCoords: HexResourcesByCoords | null,
  hexCoords: HexCoords,
  resourceType: string,
): number | null {
  if (hexResourcesByCoords == null) {
    return null;
  }

  const hexResources = hexResourcesByCoords[hexCoordsKey(hexCoords)];
  if (hexResources == null) {
    return null;
  }

  const resourceInHex = hexResources.resources.some(
    (resource) => resource.type === resourceType,
  );
  if (!resourceInHex) {
    return null;
  }

  return (
    getPermanentBiomeResources(hexResources.biome).find(
      (resource) => resource.id === resourceType,
    )?.quantity ?? null
  );
}

export function buildHexResourcesByCoords(
  resources: ReadonlyArray<PlanetHexResources | null>,
): HexResourcesByCoords {
  const byCoords: Record<string, PlanetHexResources> = {};

  for (const hexResources of resources) {
    if (hexResources == null) {
      continue;
    }

    byCoords[hexCoordsKey(hexResources.coordinates)] = hexResources;
  }

  return byCoords;
}

export function computeProjectedExtractionCargo(
  unit: UnitInstance,
  resourceYieldQuantity: number | null,
  nowMs: number,
): UnitCargo {
  if (unit.status !== 'extracting' || resourceYieldQuantity == null) {
    return unit.cargo;
  }

  const extraction = parseUnitExtractionMetadata(unit.metadata);
  const extractionSpeed = unit.type.capabilities.extraction?.speed;
  const cargoCapacity = unit.type.capabilities.cargo?.size;

  if (extraction == null || extractionSpeed == null || cargoCapacity == null) {
    return unit.cargo;
  }

  const elapsedMs = nowMs - Date.parse(extraction.lastTickAt);
  if (elapsedMs <= 0) {
    return unit.cargo;
  }

  const tickCount = elapsedMs / PLANET_EXTRACTION_TICK_MS;
  const pendingYield = computeExtractionYield(
    resourceYieldQuantity,
    extractionSpeed,
    tickCount,
  );
  const clampedPending = clampYieldToCargoCapacity(pendingYield, unit.cargo, cargoCapacity);

  return addYieldToCargo(unit.cargo, extraction.resourceType, clampedPending);
}

export function withProjectedExtractionCargo(
  unit: UnitInstance,
  hexResourcesByCoords: HexResourcesByCoords | null,
  nowMs: number,
): UnitInstance {
  if (unit.status !== 'extracting') {
    return unit;
  }

  const extraction = parseUnitExtractionMetadata(unit.metadata);
  if (extraction == null) {
    return unit;
  }

  const yieldQuantity = getHexResourceYieldQuantity(
    hexResourcesByCoords,
    extraction.hexCoords,
    extraction.resourceType,
  );
  const cargo = computeProjectedExtractionCargo(unit, yieldQuantity, nowMs);

  if (cargo === unit.cargo) {
    return unit;
  }

  return { ...unit, cargo };
}
