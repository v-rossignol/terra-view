import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HEX_LAYOUT,
  axialToScreen,
  fitFocusClusterLayout,
  fitLayoutToBounds,
  getFocusClusterPixelBounds,
  getFocusClusterTopLeft,
  getGridPixelSize,
  getHexCenterDistance,
  getMaxAdjacentHexCenterDistance,
  getToroidalHexScreenOffset,
  hexVerticalStep,
} from '@utils/hexLayout';
import { getHexNeighbors } from '@utils/planetGrid';

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

  it('treats (4, 5) as adjacent to (5, 6) on screen', () => {
    const distance = getHexCenterDistance({ q: 5, r: 6 }, { q: 4, r: 5 }, DEFAULT_HEX_LAYOUT, 10);
    expect(distance).toBeLessThanOrEqual(getMaxAdjacentHexCenterDistance(DEFAULT_HEX_LAYOUT));
  });

  it('treats (6, 5) as not adjacent to (5, 6) on screen', () => {
    const distance = getHexCenterDistance({ q: 5, r: 6 }, { q: 6, r: 5 }, DEFAULT_HEX_LAYOUT, 10);
    expect(distance).toBeGreaterThan(getMaxAdjacentHexCenterDistance(DEFAULT_HEX_LAYOUT));
  });

  it('places (4, 5) up-left of (5, 6)', () => {
    const offset = getToroidalHexScreenOffset({ q: 5, r: 6 }, { q: 4, r: 5 }, DEFAULT_HEX_LAYOUT, 10);
    expect(offset.x).toBeLessThan(0);
    expect(offset.y).toBeLessThan(0);
  });

  it('fits a focus hex and its neighbors inside the viewport at zoom level 2', () => {
    const radius = 10;
    const focus = { q: 5, r: 6 };
    const neighbors = getHexNeighbors(focus.q, focus.r, radius, DEFAULT_HEX_LAYOUT);
    const bounds = { width: 800, height: 600 };
    const fitted = fitFocusClusterLayout(bounds, DEFAULT_HEX_LAYOUT, focus, neighbors, radius);
    const cluster = getFocusClusterPixelBounds(focus, neighbors, fitted, radius);

    expect(cluster.width).toBeLessThan(bounds.width);
    expect(cluster.height).toBeLessThan(bounds.height);
  });

  it('centers a focus cluster in the viewport', () => {
    const radius = 10;
    const focus = { q: 5, r: 6 };
    const neighbors = getHexNeighbors(focus.q, focus.r, radius, DEFAULT_HEX_LAYOUT);
    const viewport = { width: 800, height: 600 };
    const layout = fitFocusClusterLayout(viewport, DEFAULT_HEX_LAYOUT, focus, neighbors, radius);
    const topLeft = getFocusClusterTopLeft(viewport, layout, focus, neighbors, radius);
    const cluster = getFocusClusterPixelBounds(focus, neighbors, layout, radius);

    expect(topLeft.x + (cluster.minX + cluster.maxX) / 2).toBeCloseTo(viewport.width / 2);
    expect(topLeft.y + (cluster.minY + cluster.maxY) / 2).toBeCloseTo(viewport.height / 2);
  });
});
