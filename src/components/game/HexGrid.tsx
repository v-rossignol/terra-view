import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { HexCoords, PlanetHexagon } from '../../types/planet';
import { useContainerSize } from '../../hooks/useContainerSize';
import { getBiomeColor } from '../../utils/biomeColors';
import { getBiomeTileset } from '../../utils/biomeTilesets';
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
  playerHex?: HexCoords;
  layout?: HexLayoutConfig;
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
  playerHex,
  layout: baseLayout = DEFAULT_HEX_LAYOUT,
}: HexGridProps) {
  const { ref, size } = useContainerSize<HTMLDivElement>();
  const cells = hexagons?.length ? hexagons : buildFallbackHexagons(radius);

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
            const isPlayer =
              playerHex != null && playerHex.q === q && playerHex.r === r;

            return (
              <div
                key={`${q},${r}`}
                className={`hex-grid__cell${isPlayer ? ' hex-grid__cell--player' : ''}`}
                style={{
                  left: x,
                  top: y,
                  backgroundColor: getBiomeColor(hex.biome),
                  backgroundImage: `url(${getBiomeTileset(hex.biome)})`,
                }}
                title={`${q}, ${r}`}
                data-q={q}
                data-r={r}
              >
                <span className="hex-grid__coords">
                  ({q},{r})
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
