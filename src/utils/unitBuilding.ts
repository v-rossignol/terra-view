import type { BuildingZoneId, UnitSize } from '@infinity/shared-config';
import { buildPositionFromBuildingZoneId, getBuildFootprintCells } from '@infinity/shared-utils';
import type { HexCoords } from '../types/planet';
import type { Vec2Local } from '../types/player';
import type { UnitInstance } from '../types/unit';

export interface BuildingMetadata {
  targetTypeId: string;
  planetId: string;
  hexCoords: HexCoords;
  buildingZoneId: BuildingZoneId;
  startedAt: string;
  completedAt: string;
}

export interface ConstructionSite {
  builderUnitId: string;
  targetTypeId: string;
  targetName: string;
  footprintCells: number;
  hexCoords: HexCoords;
  position: Vec2Local;
  startedAt: string;
  completedAt: string;
}

export function parseBuildingMetadata(metadata: Record<string, unknown>): BuildingMetadata | null {
  const raw = metadata.building;
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const building = raw as Record<string, unknown>;
  const hexCoords = building.hexCoords;
  const buildingZoneId = building.buildingZoneId;

  if (
    typeof building.targetTypeId !== 'string' ||
    typeof building.planetId !== 'string' ||
    typeof building.startedAt !== 'string' ||
    typeof building.completedAt !== 'string' ||
    hexCoords == null ||
    typeof hexCoords !== 'object' ||
    typeof (hexCoords as Record<string, unknown>).q !== 'number' ||
    typeof (hexCoords as Record<string, unknown>).r !== 'number' ||
    typeof buildingZoneId !== 'string'
  ) {
    return null;
  }

  return {
    targetTypeId: building.targetTypeId,
    planetId: building.planetId,
    hexCoords: hexCoords as HexCoords,
    buildingZoneId: buildingZoneId as BuildingZoneId,
    startedAt: building.startedAt,
    completedAt: building.completedAt,
  };
}

export function computeBuildProgressPercent(
  startedAt: string,
  completedAt: string,
  nowMs: number,
): number {
  const start = Date.parse(startedAt);
  const end = Date.parse(completedAt);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 100;
  }

  const elapsed = nowMs - start;
  const total = end - start;
  const raw = (elapsed / total) * 100;

  return Math.min(100, Math.max(0, Math.floor(raw)));
}

function resolveTargetTypeFromPlanet(
  targetTypeId: string,
  planetUnits: UnitInstance[],
): UnitInstance['type'] | undefined {
  return planetUnits.find((unit) => unit.typeId === targetTypeId)?.type;
}

function humanizeTypeId(typeId: string): string {
  return typeId
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveTargetTypeSize(targetTypeId: string, planetUnits: UnitInstance[]): UnitSize {
  return resolveTargetTypeFromPlanet(targetTypeId, planetUnits)?.size ?? 'small';
}

function resolveTargetTypeName(targetTypeId: string, planetUnits: UnitInstance[]): string {
  return resolveTargetTypeFromPlanet(targetTypeId, planetUnits)?.name ?? humanizeTypeId(targetTypeId);
}

export function listOwnConstructionSites(
  planetUnits: UnitInstance[],
  playerId: string | undefined,
): ConstructionSite[] {
  if (playerId == null) {
    return [];
  }

  const sites: ConstructionSite[] = [];

  for (const unit of planetUnits) {
    if (unit.ownerId !== playerId || unit.status !== 'building') {
      continue;
    }

    const building = parseBuildingMetadata(unit.metadata);
    if (building == null) {
      continue;
    }

    sites.push({
      builderUnitId: unit.id,
      targetTypeId: building.targetTypeId,
      targetName: resolveTargetTypeName(building.targetTypeId, planetUnits),
      footprintCells: getBuildFootprintCells(
        resolveTargetTypeSize(building.targetTypeId, planetUnits),
      ),
      hexCoords: building.hexCoords,
      position: buildPositionFromBuildingZoneId(building.buildingZoneId),
      startedAt: building.startedAt,
      completedAt: building.completedAt,
    });
  }

  return sites;
}

export function constructionSitesForHex(
  sites: ConstructionSite[],
  hexCoords: HexCoords,
): ConstructionSite[] {
  return sites.filter(
    (site) => site.hexCoords.q === hexCoords.q && site.hexCoords.r === hexCoords.r,
  );
}
