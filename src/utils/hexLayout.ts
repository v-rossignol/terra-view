import { PLANET_HEX_LAYOUT_WIDTH, PLANET_HEX_LAYOUT_HEIGHT, PLANET_HEX_VERTEX_FRACTIONS } from '@infinity/shared-config';

export interface HexLayoutConfig {
  hexWidth: number;
  hexHeight: number;
}

/** Default pointy-top layout — dimensions shared with the server via @infinity/shared-config. */
export const DEFAULT_HEX_LAYOUT: HexLayoutConfig = {
  hexWidth: PLANET_HEX_LAYOUT_WIDTH,
  hexHeight: PLANET_HEX_LAYOUT_HEIGHT,
};

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface GridPixelSize {
  width: number;
  height: number;
}

/** Vertical distance between hex row centers (algorithm.js: hexHeight * 0.75). */
export function hexVerticalStep(hexHeight: number): number {
  return hexHeight * 0.75;
}

/** Longest vertex-to-vertex distance inside one hex (1.0 hex unit at speed calibration). */
export function getMaxIntraHexDistance(
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): number {
  const vertices = PLANET_HEX_VERTEX_FRACTIONS.map((vertex) => ({
    x: vertex.x * config.hexWidth,
    y: vertex.y * config.hexHeight,
  }));

  let maxDistance = 0;
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      const dx = vertices[i].x - vertices[j].x;
      const dy = vertices[i].y - vertices[j].y;
      maxDistance = Math.max(maxDistance, Math.hypot(dx, dy));
    }
  }

  return maxDistance;
}

/** Converts a hex-unit distance to screen pixels for the given layout. */
export function hexDistanceToPixels(
  distanceHex: number,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): number {
  return distanceHex * getMaxIntraHexDistance(config);
}

/**
 * Map axial grid indices (q, r) to top-left screen position for a pointy-top odd-r grid.
 * Matches documentation/wip/grid/algorithm.js with x → q and y → r.
 */
export function axialToScreen(
  q: number,
  r: number,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): ScreenPoint {
  return {
    x: q * config.hexWidth + (r % 2) * (config.hexWidth / 2),
    y: r * hexVerticalStep(config.hexHeight),
  };
}

/** Longest center-to-center distance between visually touching hexes on this layout. */
export function getMaxAdjacentHexCenterDistance(
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): number {
  return (
    Math.hypot(config.hexWidth, hexVerticalStep(config.hexHeight)) * 1.02
  );
}

/** Shortest screen offset between two hexes, folding toroidal jumps when `radius` is set. */
export function getToroidalHexScreenOffset(
  focus: { q: number; r: number },
  neighbor: { q: number; r: number },
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
  radius?: number,
): ScreenPoint {
  const focusScreen = axialToScreen(focus.q, focus.r, config);
  const neighborScreen = axialToScreen(neighbor.q, neighbor.r, config);
  const dx = neighborScreen.x - focusScreen.x;
  const dy = neighborScreen.y - focusScreen.y;

  if (radius == null || radius <= 0) {
    return { x: dx, y: dy };
  }

  const gridWidth = radius * config.hexWidth;
  const gridHeight = (radius + 1) * hexVerticalStep(config.hexHeight);
  let bestX = dx;
  let bestY = dy;
  let bestDistance = Math.hypot(dx, dy);

  for (const xShift of [-gridWidth, 0, gridWidth]) {
    for (const yShift of [-gridHeight, 0, gridHeight]) {
      const shiftedX = dx + xShift;
      const shiftedY = dy + yShift;
      const distance = Math.hypot(shiftedX, shiftedY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestX = shiftedX;
        bestY = shiftedY;
      }
    }
  }

  return { x: bestX, y: bestY };
}

export function getHexCenterDistance(
  a: { q: number; r: number },
  b: { q: number; r: number },
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
  radius?: number,
): number {
  const offset = getToroidalHexScreenOffset(a, b, config, radius);
  return Math.hypot(offset.x, offset.y);
}

/** Pixel bounds for a radius × (radius + 1) toroidal hex grid (accounts for odd-r offset). */
export function getGridPixelSize(
  radius: number,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): GridPixelSize {
  if (radius <= 0) {
    return { width: 0, height: 0 };
  }

  const width = radius;
  const height = radius + 1;
  let pixelWidth = 0;
  let pixelHeight = 0;

  for (let r = 0; r < height; r += 1) {
    for (let q = 0; q < width; q += 1) {
      const { x, y } = axialToScreen(q, r, config);
      pixelWidth = Math.max(pixelWidth, x + config.hexWidth);
      pixelHeight = Math.max(pixelHeight, y + config.hexHeight);
    }
  }

  return { width: pixelWidth, height: pixelHeight };
}

export function scaleLayoutConfig(
  config: HexLayoutConfig,
  scale: number,
): HexLayoutConfig {
  return {
    hexWidth: config.hexWidth * scale,
    hexHeight: config.hexHeight * scale,
  };
}

/** Slightly undershoot to avoid scrollbars from borders, outlines, and sub-pixel rounding. */
export const FIT_SCALE_MARGIN = 0.96;

/** Scale a base layout so the full grid fits inside the given bounds. */
export function fitLayoutToBounds(
  radius: number,
  bounds: GridPixelSize,
  baseConfig: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
  padding = 8,
): HexLayoutConfig {
  const natural = getGridPixelSize(radius, baseConfig);
  if (
    natural.width === 0 ||
    natural.height === 0 ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return scaleLayoutConfig(baseConfig, 0);
  }

  const availableWidth = Math.max(bounds.width - padding * 2, 0);
  const availableHeight = Math.max(bounds.height - padding * 2, 0);
  if (availableWidth === 0 || availableHeight === 0) {
    return scaleLayoutConfig(baseConfig, 0);
  }

  const scale =
    Math.min(availableWidth / natural.width, availableHeight / natural.height) *
    FIT_SCALE_MARGIN;

  return scaleLayoutConfig(baseConfig, scale);
}

export function getLayoutScale(
  config: HexLayoutConfig,
  baseConfig: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): number {
  return config.hexWidth / baseConfig.hexWidth;
}
