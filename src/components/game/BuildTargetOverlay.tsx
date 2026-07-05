import { useCallback, useState } from 'react';
import type { MouseEvent } from 'react';
import {
  buildGridAnchorToPosition,
  isBuildFootprintInsideHex,
  normalizedPointToBuildGridAnchor,
  type BuildGridCell,
} from '@infinity/shared-utils';
import type { Vec2Local } from '../../types/player';
import { buildFootprintAnchorToCssRect } from '../../utils/buildFootprintStyle';
import { clientPointToHexLocalPosition } from '../../utils/hexLocalPosition';

export interface BuildTargetOverlayProps {
  footprintCells: number;
  pendingPosition?: Vec2Local | null;
  onSelect: (position: Vec2Local) => void;
}

function positionToAnchor(position: Vec2Local, footprintCells: number): BuildGridCell {
  return normalizedPointToBuildGridAnchor(position, footprintCells);
}

export function BuildTargetOverlay({
  footprintCells,
  pendingPosition = null,
  onSelect,
}: BuildTargetOverlayProps) {
  const [hoverAnchor, setHoverAnchor] = useState<BuildGridCell | null>(null);

  const updateHoverFromEvent = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const point = clientPointToHexLocalPosition(event.currentTarget, event.clientX, event.clientY);
      if (point == null) {
        setHoverAnchor(null);
        return;
      }

      const anchor = normalizedPointToBuildGridAnchor(point, footprintCells);
      setHoverAnchor(
        isBuildFootprintInsideHex(anchor, footprintCells) ? anchor : null,
      );
    },
    [footprintCells],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const point = clientPointToHexLocalPosition(event.currentTarget, event.clientX, event.clientY);
      if (point == null) {
        return;
      }

      const anchor = normalizedPointToBuildGridAnchor(point, footprintCells);
      if (!isBuildFootprintInsideHex(anchor, footprintCells)) {
        return;
      }

      onSelect(buildGridAnchorToPosition(anchor, footprintCells));
    },
    [footprintCells, onSelect],
  );

  const pendingAnchor =
    pendingPosition != null ? positionToAnchor(pendingPosition, footprintCells) : null;

  return (
    <div
      className="hex-grid__build-overlay"
      onMouseMove={updateHoverFromEvent}
      onMouseLeave={() => setHoverAnchor(null)}
      onClick={(event) => {
        event.stopPropagation();
        handleClick(event);
      }}
      role="presentation"
    >
      {hoverAnchor != null ? (
        <span
          className="hex-grid__build-footprint hex-grid__build-footprint--hover"
          style={buildFootprintAnchorToCssRect(hoverAnchor, footprintCells)}
          aria-hidden="true"
        />
      ) : null}
      {pendingAnchor != null ? (
        <span
          className="hex-grid__build-footprint hex-grid__build-footprint--pending"
          style={buildFootprintAnchorToCssRect(pendingAnchor, footprintCells)}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
