import {
  buildGridAnchorToNormalizedRect,
  normalizedPointToBuildGridAnchor,
  type BuildGridCell,
} from '@infinity/shared-utils';
import type { CSSProperties } from 'react';
import type { Vec2Local } from '../types/player';

export function buildFootprintAnchorToCssRect(
  anchor: BuildGridCell,
  footprintCells: number,
): CSSProperties {
  const rect = buildGridAnchorToNormalizedRect(anchor, footprintCells);

  return {
    left: `${rect.left * 100}%`,
    top: `${rect.top * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`,
  };
}

export function buildFootprintToCssRect(
  position: Vec2Local,
  footprintCells: number,
): CSSProperties {
  const anchor = normalizedPointToBuildGridAnchor(position, footprintCells);

  return buildFootprintAnchorToCssRect(anchor, footprintCells);
}
