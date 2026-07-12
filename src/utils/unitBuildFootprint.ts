import { getBuildFootprintCells, isPointInBuildFootprint } from '@infinity/shared-utils';
import type { Vec2Local } from '../types/player';
import type { UnitInstance } from '../types/unit';
import { getUnitHexLocalPosition } from './unitLocation';

export function isPointOnBuildingFootprint(point: Vec2Local, units: UnitInstance[]): boolean {
  return units.some((unit) => {
    if (unit.type.type !== 'building' || unit.status === 'destroyed') {
      return false;
    }

    const position = getUnitHexLocalPosition(unit);
    if (position == null) {
      return false;
    }

    return isPointInBuildFootprint(
      point,
      position,
      getBuildFootprintCells(unit.type.size),
    );
  });
}
