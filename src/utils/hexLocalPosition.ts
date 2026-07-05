import { isPointInPlanetHexLocal } from '@infinity/shared-utils';
import type { Vec2Local } from '../types/player';

export function isHexLocalPointInside(position: Vec2Local): boolean {
  return isPointInPlanetHexLocal(position.x, position.y);
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
