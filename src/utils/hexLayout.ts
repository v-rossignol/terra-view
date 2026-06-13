export interface HexLayoutConfig {
  hexWidth: number;
  hexHeight: number;
}

/** Default pointy-top layout (documentation/wip/grid/grid.css dimensions). */
export const DEFAULT_HEX_LAYOUT: HexLayoutConfig = {
  hexWidth: 80,
  hexHeight: 92,
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

/** Pixel bounds needed to contain every hex in a size × size grid (accounts for odd-r offset). */
export function getGridPixelSize(
  size: number,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): GridPixelSize {
  if (size <= 0) {
    return { width: 0, height: 0 };
  }

  let width = 0;
  let height = 0;

  for (let r = 0; r < size; r += 1) {
    for (let q = 0; q < size; q += 1) {
      const { x, y } = axialToScreen(q, r, config);
      width = Math.max(width, x + config.hexWidth);
      height = Math.max(height, y + config.hexHeight);
    }
  }

  return { width, height };
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
  size: number,
  bounds: GridPixelSize,
  baseConfig: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
  padding = 8,
): HexLayoutConfig {
  const natural = getGridPixelSize(size, baseConfig);
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
