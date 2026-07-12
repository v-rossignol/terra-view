import { useCallback, useState } from 'react';
import type { MouseEvent } from 'react';
import type { BuildingZoneId } from '@infinity/shared-config';
import {
  buildPlacementAnchorToBuildingZoneId,
  buildingZoneIdToBuildPlacementAnchor,
  isBuildPlacementValid,
  normalizedPointToBuildPlacementAnchor,
  type BuildPlacementAnchor,
} from '@infinity/shared-utils';
import { buildFootprintAnchorToCssRect } from '../../utils/buildFootprintStyle';
import { clientPointToHexLocalPosition } from '../../utils/hexLocalPosition';

export interface BuildTargetOverlayProps {
  footprintCells: number;
  pendingBuildingZoneId?: BuildingZoneId | null;
  onSelect: (buildingZoneId: BuildingZoneId) => void;
}

export function BuildTargetOverlay({
  footprintCells,
  pendingBuildingZoneId = null,
  onSelect,
}: BuildTargetOverlayProps) {
  const [hoverAnchor, setHoverAnchor] = useState<BuildPlacementAnchor | null>(null);

  const updateHoverFromEvent = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const point = clientPointToHexLocalPosition(event.currentTarget, event.clientX, event.clientY);
      if (point == null) {
        setHoverAnchor(null);
        return;
      }

      const anchor = normalizedPointToBuildPlacementAnchor(point, footprintCells);
      setHoverAnchor(
        isBuildPlacementValid(anchor, footprintCells) ? anchor : null,
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

      const anchor = normalizedPointToBuildPlacementAnchor(point, footprintCells);
      if (!isBuildPlacementValid(anchor, footprintCells)) {
        return;
      }

      onSelect(buildPlacementAnchorToBuildingZoneId(anchor));
    },
    [footprintCells, onSelect],
  );

  const pendingAnchor =
    pendingBuildingZoneId != null
      ? buildingZoneIdToBuildPlacementAnchor(pendingBuildingZoneId)
      : null;

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
