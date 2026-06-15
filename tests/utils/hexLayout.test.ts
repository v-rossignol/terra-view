import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HEX_LAYOUT,
  axialToScreen,
  fitLayoutToBounds,
  getGridPixelSize,
  hexVerticalStep,
} from '@utils/hexLayout';

describe('hexLayout', () => {
  it('matches documentation/wip/grid/algorithm.js for the reference dimensions', () => {
    const config = { hexWidth: 100, hexHeight: 86 };

    expect(hexVerticalStep(config.hexHeight)).toBe(64.5);
    expect(axialToScreen(0, 0, config)).toEqual({ x: 0, y: 0 });
    expect(axialToScreen(1, 0, config)).toEqual({ x: 100, y: 0 });
    expect(axialToScreen(0, 1, config)).toEqual({ x: 50, y: 64.5 });
    expect(axialToScreen(2, 3, config)).toEqual({ x: 250, y: 193.5 });
  });

  it('computes container bounds including odd-r horizontal offset', () => {
    const size = 5;
    const { width } = getGridPixelSize(size, DEFAULT_HEX_LAYOUT);
    const oddRowLast = axialToScreen(size - 1, 1, DEFAULT_HEX_LAYOUT);

    expect(width).toBe(oddRowLast.x + DEFAULT_HEX_LAYOUT.hexWidth);
    expect(width).toBeGreaterThan(
      axialToScreen(size - 1, size - 1, DEFAULT_HEX_LAYOUT).x + DEFAULT_HEX_LAYOUT.hexWidth,
    );
  });

  it('computes container bounds for a toroidal grid with an extra row', () => {
    const radius = 5;
    const { width, height } = getGridPixelSize(radius, DEFAULT_HEX_LAYOUT);
    const last = axialToScreen(radius - 1, radius, DEFAULT_HEX_LAYOUT);

    expect(height).toBe(last.y + DEFAULT_HEX_LAYOUT.hexHeight);
    expect(width).toBeGreaterThanOrEqual(last.x + DEFAULT_HEX_LAYOUT.hexWidth);
  });

  it('returns zero size for empty grids', () => {
    expect(getGridPixelSize(0)).toEqual({ width: 0, height: 0 });
  });

  it('scales layout to fit within available width and height', () => {
    const bounds = { width: 800, height: 400 };
    const fitted = fitLayoutToBounds(5, bounds, DEFAULT_HEX_LAYOUT, 0);
    const fittedSize = getGridPixelSize(5, fitted);

    expect(fittedSize.width).toBeLessThan(bounds.width);
    expect(fittedSize.height).toBeLessThan(bounds.height);
  });

  it('returns zero scale when bounds are not yet measured', () => {
    const fitted = fitLayoutToBounds(5, { width: 0, height: 0 });
    expect(fitted.hexWidth).toBe(0);
    expect(fitted.hexHeight).toBe(0);
  });
});
