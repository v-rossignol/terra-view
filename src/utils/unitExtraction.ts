import { PLANET_EXTRACTION_TICK_MS } from '@infinity/shared-config';
import {
  addYieldToCargo,
  clampYieldToCargoCapacity,
  computeExtractionYield,
  type UnitCargo,
} from '@infinity/shared-utils';
import type { HexCoords } from '../types/planet';
import type { PlanetHexResources } from '../types/resource';
import type { UnitInstance } from '../types/unit';

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

export function getHexResourceAbundance(
  hexResources: PlanetHexResources | null,
  hexCoords: HexCoords,
  resourceType: string,
): number | null {
  if (hexResources == null) {
    return null;
  }

  if (
    hexResources.coordinates.q !== hexCoords.q ||
    hexResources.coordinates.r !== hexCoords.r
  ) {
    return null;
  }

  const resource = hexResources.resources.find((entry) => entry.type === resourceType);
  return resource?.abundance ?? null;
}

export function computeProjectedExtractionCargo(
  unit: UnitInstance,
  resourceAbundance: number | null,
  nowMs: number,
): UnitCargo {
  if (unit.status !== 'extracting' || resourceAbundance == null) {
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
  const pendingYield = computeExtractionYield(resourceAbundance, extractionSpeed, tickCount);
  const clampedPending = clampYieldToCargoCapacity(pendingYield, unit.cargo, cargoCapacity);

  return addYieldToCargo(unit.cargo, extraction.resourceType, clampedPending);
}

export function withProjectedExtractionCargo(
  unit: UnitInstance,
  hexResources: PlanetHexResources | null,
  nowMs: number,
): UnitInstance {
  if (unit.status !== 'extracting') {
    return unit;
  }

  const extraction = parseUnitExtractionMetadata(unit.metadata);
  if (extraction == null) {
    return unit;
  }

  const abundance = getHexResourceAbundance(
    hexResources,
    extraction.hexCoords,
    extraction.resourceType,
  );
  const cargo = computeProjectedExtractionCargo(unit, abundance, nowMs);

  if (cargo === unit.cargo) {
    return unit;
  }

  return { ...unit, cargo };
}
