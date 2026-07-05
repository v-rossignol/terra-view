import {
  buildGridAnchorToNormalizedRect,
  getBuildFootprintCells,
  normalizedPointToBuildGridAnchor,
  type NormalizedRect,
} from '@infinity/shared-utils';
import type { Vec2Local } from '../types/player';
import type { UnitInstance } from '../types/unit';
import { getUnitHexLocalPosition } from './unitLocation';

function isPointInRect(point: Vec2Local, rect: NormalizedRect): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  );
}

export function getBuildingFootprintRect(unit: UnitInstance): NormalizedRect | null {
  if (unit.type.type !== 'building' || unit.status === 'destroyed') {
    return null;
  }

  const position = getUnitHexLocalPosition(unit);
  if (position == null) {
    return null;
  }

  const footprintCells = getBuildFootprintCells(unit.type.size);
  const anchor = normalizedPointToBuildGridAnchor(position, footprintCells);

  return buildGridAnchorToNormalizedRect(anchor, footprintCells);
}

export function isPointOnBuildingFootprint(point: Vec2Local, units: UnitInstance[]): boolean {
  return units.some((unit) => {
    const rect = getBuildingFootprintRect(unit);
    return rect != null && isPointInRect(point, rect);
  });
}
