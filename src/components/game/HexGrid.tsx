import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { HexCoords, PlanetHexagon } from '../../types/planet';
import type { UnitInstance } from '../../types/unit';
import { useContainerSize } from '../../hooks/useContainerSize';
import { getBiomeColor } from '../../utils/biomeColors';
import { getBiomeTileset } from '../../utils/biomeTilesets';
import { groupUnitsByHex } from '../../utils/unitLocation';
import { HexUnitMarkers } from './HexUnitMarkers';
import {
  DEFAULT_HEX_LAYOUT,
  axialToScreen,
  fitLayoutToBounds,
  getGridPixelSize,
  getLayoutScale,
  type HexLayoutConfig,
} from '../../utils/hexLayout';
import './HexGrid.css';

export interface HexGridProps {
  radius: number;
  hexagons?: PlanetHexagon[];
  playerId?: string;
  planetUnits?: UnitInstance[];
  hoveredHex?: HexCoords | null;
  layout?: HexLayoutConfig;
  onHexEnter?: (coords: HexCoords) => void;
  onHexLeave?: () => void;
  onHexClick?: (coords: HexCoords) => void;
}

function buildFallbackHexagons(radius: number): PlanetHexagon[] {
  const hexes: PlanetHexagon[] = [];
  const height = radius + 1;
  for (let r = 0; r < height; r += 1) {
    for (let q = 0; q < radius; q += 1) {
      hexes.push({
        biome: 'forest',
        resources: [],
        dangerLevel: 0,
        coordinates: { q, r },
      });
    }
  }
  return hexes;
}

export function HexGrid({
  radius,
  hexagons,
  playerId,
  planetUnits = [],
  hoveredHex,
  layout: baseLayout = DEFAULT_HEX_LAYOUT,
  onHexEnter,
  onHexLeave,
  onHexClick,
}: HexGridProps) {
  const { ref, size } = useContainerSize<HTMLDivElement>();
  const cells = hexagons?.length ? hexagons : buildFallbackHexagons(radius);
  const unitsByHex = useMemo(() => groupUnitsByHex(planetUnits), [planetUnits]);

  const layout = useMemo(
    () => fitLayoutToBounds(radius, size, baseLayout),
    [radius, size, baseLayout],
  );
  const { width, height } = getGridPixelSize(radius, layout);
  const scale = getLayoutScale(layout, baseLayout);
  const isReady = size.width > 0 && size.height > 0 && scale > 0;

  const viewportStyle: CSSProperties = {
    ['--hex-scale' as string]: scale,
  };

  const containerStyle: CSSProperties = {
    width,
    height,
    ['--hex-width' as string]: `${layout.hexWidth}px`,
    ['--hex-height' as string]: `${layout.hexHeight}px`,
  };

  return (
    <div ref={ref} className="hex-grid-viewport" style={viewportStyle}>
      {isReady ? (
        <div className="hex-grid" style={containerStyle} data-radius={radius}>
          {cells.map((hex) => {
            const { q, r } = hex.coordinates;
            const { x, y } = axialToScreen(q, r, layout);
            const isHovered =
              hoveredHex != null && hoveredHex.q === q && hoveredHex.r === r;
            const surfaceHostClassName = [
              'hex-grid__cell-surface-host',
              isHovered ? 'hex-grid__cell-surface-host--hovered' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={`surface-${q},${r}`}
                className={surfaceHostClassName}
                style={{ left: x, top: y }}
                data-q={q}
                data-r={r}
                aria-hidden="true"
              >
                <div
                  className="hex-grid__cell-surface"
                  style={{
                    backgroundColor: getBiomeColor(hex.biome),
                    backgroundImage: `url(${getBiomeTileset(hex.biome)})`,
                  }}
                />
              </div>
            );
          })}
          {cells.map((hex) => {
            const { q, r } = hex.coordinates;
            const { x, y } = axialToScreen(q, r, layout);
            const isHovered =
              hoveredHex != null && hoveredHex.q === q && hoveredHex.r === r;
            const hexUnits = unitsByHex.get(`${q},${r}`) ?? [];
            const cellClassName = [
              'hex-grid__cell',
              isHovered ? 'hex-grid__cell--hovered' : '',
              onHexClick != null ? 'hex-grid__cell--clickable' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={`layer-${q},${r}`}
                className={cellClassName}
                style={{ left: x, top: y }}
                data-q={q}
                data-r={r}
                onMouseEnter={() => onHexEnter?.({ q, r })}
                onMouseLeave={() => onHexLeave?.()}
                onClick={() => onHexClick?.({ q, r })}
                onKeyDown={(event) => {
                  if (onHexClick != null && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onHexClick({ q, r });
                  }
                }}
                role={onHexClick != null ? 'button' : undefined}
                tabIndex={onHexClick != null ? 0 : undefined}
              >
                <div className="hex-grid__cell-layer">
                  <HexUnitMarkers units={hexUnits} playerId={playerId} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
