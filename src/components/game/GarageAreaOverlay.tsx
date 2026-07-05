import type { Vec2Local } from '../../types/player';
import { hexDistanceToPixels, type HexLayoutConfig } from '../../utils/hexLayout';
import { hexLocalPositionToPercent } from '../../utils/hexLocalPosition';

export interface GarageAreaOverlayProps {
  center: Vec2Local;
  radiusHex: number;
  layout: HexLayoutConfig;
}

export function GarageAreaOverlay({ center, radiusHex, layout }: GarageAreaOverlayProps) {
  const radiusPx = hexDistanceToPixels(radiusHex, layout);
  const diameterPx = radiusPx * 2;
  const { left, top } = hexLocalPositionToPercent(center);

  return (
    <span
      className="hex-grid__garage-area"
      style={{
        left,
        top,
        width: `${diameterPx}px`,
        height: `${diameterPx}px`,
      }}
      aria-hidden="true"
    />
  );
}
