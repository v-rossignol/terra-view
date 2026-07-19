import { isPointInPlanetHexLocal } from '@infinity/shared-utils';
import type { HexCoords } from '../types/planet';
import type { Vec2Local } from '../types/player';

import type { UnitInstance } from '../types/unit';

export function isHexLocalPointInside(position: Vec2Local): boolean {
  return isPointInPlanetHexLocal(position.x, position.y);
}

export function clientPointToHexLocalAt(
  cellLeft: number,
  cellTop: number,
  hexWidth: number,
  hexHeight: number,
  containerRect: Pick<DOMRect, 'left' | 'top'>,
  clientX: number,
  clientY: number,
): Vec2Local | null {
  if (hexWidth <= 0 || hexHeight <= 0) {
    return null;
  }

  const x = (clientX - (containerRect.left + cellLeft)) / hexWidth;
  const y = (clientY - (containerRect.top + cellTop)) / hexHeight;

  if (!isPointInPlanetHexLocal(x, y)) {
    return null;
  }

  return { x, y };
}

export interface ClusterHexCell {
  cellCoords: HexCoords;
  isFocus: boolean;
  left: number;
  top: number;
  hexUnits: UnitInstance[];
  isMoveTarget: boolean;
  isNeighborClickable: boolean;
}

/** Resolves a cluster click to a hex cell, preferring neighbors over focus in overlap zones. */
export function resolveClusterHexClick(
  cells: ClusterHexCell[],
  hexWidth: number,
  hexHeight: number,
  containerRect: Pick<DOMRect, 'left' | 'top'>,
  clientX: number,
  clientY: number,
): { cell: ClusterHexCell; position: Vec2Local } | null {
  const ordered = [
    ...cells.filter((cell) => !cell.isFocus),
    ...cells.filter((cell) => cell.isFocus),
  ];

  for (const cell of ordered) {
    const position = clientPointToHexLocalAt(
      cell.left,
      cell.top,
      hexWidth,
      hexHeight,
      containerRect,
      clientX,
      clientY,
    );

    if (position != null) {
      return { cell, position };
    }
  }

  return null;
}

export function clientPointToHexLocalPosition(
  cellElement: HTMLElement,
  clientX: number,
  clientY: number,
): Vec2Local | null {
  const rect = cellElement.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;

  if (!isPointInPlanetHexLocal(x, y)) {
    return null;
  }

  return { x, y };
}

export function hexLocalPositionToPercent(position: Vec2Local): { left: string; top: string } {
  return {
    left: `${position.x * 100}%`,
    top: `${position.y * 100}%`,
  };
}
