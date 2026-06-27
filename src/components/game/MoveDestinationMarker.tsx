import type { Vec2Local } from '../../types/player';
import { hexLocalPositionToPercent } from '../../utils/hexLocalPosition';

export interface MoveDestinationMarkerProps {
  position: Vec2Local;
}

export function MoveDestinationMarker({ position }: MoveDestinationMarkerProps) {
  const { left, top } = hexLocalPositionToPercent(position);

  return (
    <span
      className="hex-grid__move-marker"
      style={{ left, top }}
      aria-hidden="true"
    />
  );
}
