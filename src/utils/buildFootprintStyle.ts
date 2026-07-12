import {
  buildPlacementToNormalizedFootprint,
  positionToBuildPlacementAnchor,
  type BuildPlacementAnchor,
} from '@infinity/shared-utils';
import type { CSSProperties } from 'react';
import type { Vec2Local } from '../types/player';

export function buildFootprintAnchorToCssRect(
  anchor: BuildPlacementAnchor,
  footprintCells: number,
): CSSProperties {
  const footprint = buildPlacementToNormalizedFootprint(anchor, footprintCells);
  const style: CSSProperties = {
    left: `${footprint.left * 100}%`,
    top: `${footprint.top * 100}%`,
    width: `${footprint.width * 100}%`,
    height: `${footprint.height * 100}%`,
  };

  if (footprint.rotationDeg !== 0) {
    style.transform = `rotate(${footprint.rotationDeg}deg)`;
    style.transformOrigin = 'center center';
  }

  return style;
}

export function buildFootprintToCssRect(
  position: Vec2Local,
  footprintCells: number,
): CSSProperties {
  const anchor = positionToBuildPlacementAnchor(position, footprintCells);

  return buildFootprintAnchorToCssRect(anchor, footprintCells);
}
