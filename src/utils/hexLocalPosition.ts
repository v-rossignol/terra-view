import type { Vec2Local } from '../types/player';

/** Pointy-top hex polygon vertices as fractions of cell width/height (matches clip-path). */
const HEX_POLYGON_FRACTIONS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0.5, y: 0 },
  { x: 1, y: 0.25 },
  { x: 1, y: 0.75 },
  { x: 0.5, y: 1 },
  { x: 0, y: 0.75 },
  { x: 0, y: 0.25 },
];

function isPointInPolygon(x: number, y: number, polygon: ReadonlyArray<{ x: number; y: number }>): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
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

  if (!isPointInPolygon(x, y, HEX_POLYGON_FRACTIONS)) {
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
