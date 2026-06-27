import { useMemo } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { HexCoords, PlanetHexagon } from '../../types/planet';
import type { Vec2Local } from '../../types/player';
import type { UnitInstance } from '../../types/unit';
import { useContainerSize } from '../../hooks/useContainerSize';
import { getBiomeColor } from '../../utils/biomeColors';
import { getBiomeTileset } from '../../utils/biomeTilesets';
import { clientPointToHexLocalPosition } from '../../utils/hexLocalPosition';
import { groupUnitsByHex } from '../../utils/unitLocation';
import { hexCoordsKey } from '../../utils/unitMovement';
import { HexUnitMarkers } from './HexUnitMarkers';
import { MoveDestinationMarker } from './MoveDestinationMarker';
import {
  DEFAULT_HEX_LAYOUT,
  getToroidalHexScreenOffset,
  type HexLayoutConfig,
} from '../../utils/hexLayout';
import './HexGrid.css';

/** Center hex fills this fraction of the viewport; neighbors peek at the edges. */
const CENTER_HEX_FILL = 0.85;

export interface MoveDestination {
  hex_coords: HexCoords;
  position: Vec2Local;
}

export interface SingleHexViewProps {
  hex: PlanetHexagon;
  radius: number;
  neighbors?: PlanetHexagon[];
  playerId?: string;
  planetUnits?: UnitInstance[];
  selectedUnitId?: string | null;
  onUnitSelect?: (unit: UnitInstance) => void;
  onNeighborClick?: (coords: HexCoords) => void;
  moveModeActive?: boolean;
  validMoveHexes?: HexCoords[];
  pendingMoveDestination?: MoveDestination | null;
  onMoveDestinationSelect?: (hex_coords: HexCoords, position: Vec2Local) => void;
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

function coordsMatch(a: HexCoords, b: HexCoords): boolean {
  return a.q === b.q && a.r === b.r;
}

export function SingleHexView({
  hex,
  radius,
  neighbors = [],
  playerId,
  planetUnits = [],
  selectedUnitId = null,
  onUnitSelect,
  onNeighborClick,
  moveModeActive = false,
  validMoveHexes = [],
  pendingMoveDestination = null,
  onMoveDestinationSelect,
  layout: baseLayout = DEFAULT_HEX_LAYOUT,
}: SingleHexViewProps) {
  const { ref, size } = useContainerSize<HTMLDivElement>();
  const layout = fitFocusHexLayout(size, baseLayout);
  const scale = layout.hexWidth / baseLayout.hexWidth;
  const isReady = size.width > 0 && size.height > 0 && scale > 0;

  const focus = hex.coordinates;
  const cells = useMemo(() => [hex, ...neighbors], [hex, neighbors]);
  const unitsByHex = useMemo(() => groupUnitsByHex(planetUnits), [planetUnits]);
  const validMoveHexKeys = useMemo(
    () => new Set(validMoveHexes.map(hexCoordsKey)),
    [validMoveHexes],
  );

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

  const viewportClassName = [
    'hex-grid-viewport',
    'hex-grid-viewport--focus',
    moveModeActive ? 'hex-grid-viewport--move-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleCellClick = (
    event: MouseEvent<HTMLDivElement>,
    cellCoords: HexCoords,
    isMoveTarget: boolean,
    isFocus: boolean,
  ) => {
    if (moveModeActive && isMoveTarget) {
      const position = clientPointToHexLocalPosition(event.currentTarget, event.clientX, event.clientY);
      if (position != null) {
        onMoveDestinationSelect?.(cellCoords, position);
      }
      return;
    }

    if (!isFocus && onNeighborClick != null) {
      onNeighborClick(cellCoords);
    }
  };

  return (
    <div ref={ref} className={viewportClassName} style={viewportStyle}>
      {isReady ? (
        <div className="hex-grid hex-grid--focus-cluster" style={clusterStyle}>
          {cells.map((cell) => {
            const { q, r } = cell.coordinates;
            const cellCoords = { q, r };
            const isFocus = q === focus.q && r === focus.r;
            const offset = isFocus
              ? { x: 0, y: 0 }
              : getToroidalHexScreenOffset(focus, cellCoords, layout, radius);
            const hexUnits = unitsByHex.get(`${q},${r}`) ?? [];
            const isMoveTarget = moveModeActive && validMoveHexKeys.has(hexCoordsKey(cellCoords));
            const isNeighborClickable = !isFocus && onNeighborClick != null && !moveModeActive;
            const showMarker =
              pendingMoveDestination != null &&
              coordsMatch(pendingMoveDestination.hex_coords, cellCoords);
            const cellClassName = [
              'hex-grid__cell',
              isFocus ? 'hex-grid__cell--focus' : 'hex-grid__cell--neighbor',
              isNeighborClickable ? 'hex-grid__cell--clickable' : '',
              isMoveTarget ? 'hex-grid__cell--move-target' : '',
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
                onClick={(event) => handleCellClick(event, cellCoords, isMoveTarget, isFocus)}
                onKeyDown={
                  isNeighborClickable
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onNeighborClick(cellCoords);
                        }
                      }
                    : undefined
                }
                role={isNeighborClickable ? 'button' : undefined}
                tabIndex={isNeighborClickable ? 0 : undefined}
                aria-label={!isFocus ? `Neighbor hex (${q}, ${r})` : undefined}
              >
                <HexUnitMarkers
                  units={hexUnits}
                  playerId={playerId}
                  ownUnitMarker="sprite"
                  selectable={isFocus && onUnitSelect != null && !moveModeActive}
                  selectedUnitId={selectedUnitId}
                  onUnitSelect={onUnitSelect}
                />
                {showMarker ? <MoveDestinationMarker position={pendingMoveDestination.position} /> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
