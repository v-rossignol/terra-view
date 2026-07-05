import type { UnitSize } from '@infinity/shared-config';
import { getBuildFootprintCells } from '@infinity/shared-utils';
import type { HexCoords } from '../types/planet';
import type { Vec2Local } from '../types/player';
import type { UnitInstance } from '../types/unit';

export interface BuildingMetadata {
  targetTypeId: string;
  planetId: string;
  hexCoords: HexCoords;
  position: Vec2Local;
  startedAt: string;
  completedAt: string;
}

export interface ConstructionSite {
  builderUnitId: string;
  targetTypeId: string;
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
  const position = building.position;

  if (
    typeof building.targetTypeId !== 'string' ||
    typeof building.planetId !== 'string' ||
    typeof building.startedAt !== 'string' ||
    typeof building.completedAt !== 'string' ||
    hexCoords == null ||
    typeof hexCoords !== 'object' ||
    typeof (hexCoords as Record<string, unknown>).q !== 'number' ||
    typeof (hexCoords as Record<string, unknown>).r !== 'number' ||
    position == null ||
    typeof position !== 'object' ||
    typeof (position as Record<string, unknown>).x !== 'number' ||
    typeof (position as Record<string, unknown>).y !== 'number'
  ) {
    return null;
  }

  return {
    targetTypeId: building.targetTypeId,
    planetId: building.planetId,
    hexCoords: hexCoords as HexCoords,
    position: position as Vec2Local,
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

function resolveTargetTypeSize(targetTypeId: string, planetUnits: UnitInstance[]): UnitSize {
  const match = planetUnits.find((unit) => unit.typeId === targetTypeId);
  return match?.type.size ?? 'small';
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
      footprintCells: getBuildFootprintCells(
        resolveTargetTypeSize(building.targetTypeId, planetUnits),
      ),
      hexCoords: building.hexCoords,
      position: building.position,
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
