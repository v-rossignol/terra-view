import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { HexCoords, PlanetHexagon } from '../../types/planet';
import { useContainerSize } from '../../hooks/useContainerSize';
import { getBiomeColor } from '../../utils/biomeColors';
import { getBiomeTileset } from '../../utils/biomeTilesets';
import {
  DEFAULT_HEX_LAYOUT,
  getToroidalHexScreenOffset,
  type HexLayoutConfig,
} from '../../utils/hexLayout';
import './HexGrid.css';

/** Center hex fills this fraction of the viewport; neighbors peek at the edges. */
const CENTER_HEX_FILL = 0.85;

export interface SingleHexViewProps {
  hex: PlanetHexagon;
  radius: number;
  neighbors?: PlanetHexagon[];
  onNeighborClick?: (coords: HexCoords) => void;
  layout?: HexLayoutConfig;
}

function fitFocusHexLayout(
  bounds: { width: number; height: number },
  baseConfig: HexLayoutConfig,
  padding = 8,
): HexLayoutConfig {
  if (bounds.width <= 0 || bounds.height <= 0) {
    return {
      hexWidth: baseConfig.hexWidth * 0,
      hexHeight: baseConfig.hexHeight * 0,
    };
  }

  const availableWidth = Math.max(bounds.width - padding * 2, 0);
  const availableHeight = Math.max(bounds.height - padding * 2, 0);
  if (availableWidth === 0 || availableHeight === 0) {
    return {
      hexWidth: baseConfig.hexWidth * 0,
      hexHeight: baseConfig.hexHeight * 0,
    };
  }

  const scale =
    Math.min(availableWidth / baseConfig.hexWidth, availableHeight / baseConfig.hexHeight) *
    CENTER_HEX_FILL;

  return {
    hexWidth: baseConfig.hexWidth * scale,
    hexHeight: baseConfig.hexHeight * scale,
  };
}

export function SingleHexView({
  hex,
  radius,
  neighbors = [],
  onNeighborClick,
  layout: baseLayout = DEFAULT_HEX_LAYOUT,
}: SingleHexViewProps) {
  const { ref, size } = useContainerSize<HTMLDivElement>();
  const layout = fitFocusHexLayout(size, baseLayout);
  const scale = layout.hexWidth / baseLayout.hexWidth;
  const isReady = size.width > 0 && size.height > 0 && scale > 0;

  const focus = hex.coordinates;
  const cells = useMemo(() => [hex, ...neighbors], [hex, neighbors]);

  const centerX = size.width / 2 - layout.hexWidth / 2;
  const centerY = size.height / 2 - layout.hexHeight / 2;

  const viewportStyle: CSSProperties = {
    ['--hex-scale' as string]: scale,
  };

  const clusterStyle: CSSProperties = {
    position: 'relative',
    width: size.width,
    height: size.height,
    ['--hex-width' as string]: `${layout.hexWidth}px`,
    ['--hex-height' as string]: `${layout.hexHeight}px`,
  };

  return (
    <div ref={ref} className="hex-grid-viewport hex-grid-viewport--focus" style={viewportStyle}>
      {isReady ? (
        <div className="hex-grid hex-grid--focus-cluster" style={clusterStyle}>
          {cells.map((cell) => {
            const { q, r } = cell.coordinates;
            const isFocus = q === focus.q && r === focus.r;
            const offset = isFocus
              ? { x: 0, y: 0 }
              : getToroidalHexScreenOffset(focus, { q, r }, layout, radius);
            const cellClassName = [
              'hex-grid__cell',
              isFocus ? 'hex-grid__cell--focus' : 'hex-grid__cell--neighbor',
              !isFocus && onNeighborClick != null ? 'hex-grid__cell--clickable' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={`${q},${r}`}
                className={cellClassName}
                style={{
                  left: centerX + offset.x,
                  top: centerY + offset.y,
                  backgroundColor: getBiomeColor(cell.biome),
                  backgroundImage: `url(${getBiomeTileset(cell.biome)})`,
                }}
                data-q={q}
                data-r={r}
                onClick={!isFocus ? () => onNeighborClick?.({ q, r }) : undefined}
                onKeyDown={
                  !isFocus && onNeighborClick != null
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onNeighborClick({ q, r });
                        }
                      }
                    : undefined
                }
                role={!isFocus && onNeighborClick != null ? 'button' : undefined}
                tabIndex={!isFocus && onNeighborClick != null ? 0 : undefined}
                aria-label={!isFocus ? `Neighbor hex (${q}, ${r})` : undefined}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
