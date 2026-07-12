import { useCallback, useMemo } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { BuildingZoneId } from '@infinity/shared-config';
import type { HexCoords, PlanetHexagon } from '../../types/planet';
import type { Vec2Local } from '../../types/player';
import type { UnitInstance, UnitMovementTrack } from '../../types/unit';
import { useAnimationNow } from '../../hooks/useAnimationNow';
import { useContainerSize } from '../../hooks/useContainerSize';
import { getBiomeColor } from '../../utils/biomeColors';
import { getBiomeTileset } from '../../utils/biomeTilesets';
import { clientPointToHexLocalPosition } from '../../utils/hexLocalPosition';
import { isPointOnBuildingFootprint } from '../../utils/unitBuildFootprint';
import { groupUnitsByHex } from '../../utils/unitLocation';
import { hexCoordsKey } from '../../utils/unitMovement';
import { HexUnitMarkers } from './HexUnitMarkers';
import { BuildTargetOverlay } from './BuildTargetOverlay';
import { ConstructionSiteOverlay } from './ConstructionSiteOverlay';
import { GarageAreaOverlay } from './GarageAreaOverlay';
import { MoveDestinationMarker } from './MoveDestinationMarker';
import { MovingUnitsOverlay } from './MovingUnitsOverlay';
import { isMovingVehicule } from '../../utils/unitMovementTrack';
import {
  constructionSitesForHex,
  listOwnConstructionSites,
} from '../../utils/unitBuilding';
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

export interface GarageAreaPreview {
  center: Vec2Local;
  radiusHex: number;
}

export interface SingleHexViewProps {
  hex: PlanetHexagon;
  radius: number;
  neighbors?: PlanetHexagon[];
  playerId?: string;
  planetUnits?: UnitInstance[];
  selectedUnitId?: string | null;
  onUnitSelect?: (unit: UnitInstance) => void;
  onNeighborUnitSelect?: (coords: HexCoords, unit: UnitInstance) => void;
  onNeighborClick?: (coords: HexCoords) => void;
  moveModeActive?: boolean;
  validMoveHexes?: HexCoords[];
  pendingMoveDestination?: MoveDestination | null;
  movementTracks?: Readonly<Record<string, UnitMovementTrack>>;
  onMoveDestinationSelect?: (hex_coords: HexCoords, position: Vec2Local) => void;
  buildModeActive?: boolean;
  buildFootprintCells?: number;
  pendingBuildingZoneId?: BuildingZoneId | null;
  onBuildTargetSelect?: (buildingZoneId: BuildingZoneId) => void;
  garageAreaPreview?: GarageAreaPreview | null;
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
  onNeighborUnitSelect,
  onNeighborClick,
  moveModeActive = false,
  validMoveHexes = [],
  pendingMoveDestination = null,
  movementTracks = {},
  onMoveDestinationSelect,
  buildModeActive = false,
  buildFootprintCells = 1,
  pendingBuildingZoneId = null,
  onBuildTargetSelect,
  garageAreaPreview = null,
  layout: baseLayout = DEFAULT_HEX_LAYOUT,
}: SingleHexViewProps) {
  const { ref, size } = useContainerSize<HTMLDivElement>();
  const layout = fitFocusHexLayout(size, baseLayout);
  const scale = layout.hexWidth / baseLayout.hexWidth;
  const isReady = size.width > 0 && size.height > 0 && scale > 0;

  const focus = hex.coordinates;
  const cells = useMemo(() => [hex, ...neighbors], [hex, neighbors]);
  const staticUnits = useMemo(
    () => planetUnits.filter((unit) => !isMovingVehicule(unit)),
    [planetUnits],
  );
  const unitsByHex = useMemo(() => groupUnitsByHex(staticUnits), [staticUnits]);
  const visibleHexKeys = useMemo(
    () => new Set(cells.map((cell) => hexCoordsKey(cell.coordinates))),
    [cells],
  );
  const constructionSites = useMemo(
    () => listOwnConstructionSites(planetUnits, playerId),
    [planetUnits, playerId],
  );
  const hasMovingVehicules = useMemo(
    () => planetUnits.some(isMovingVehicule),
    [planetUnits],
  );
  const nowMs = useAnimationNow(hasMovingVehicules || constructionSites.length > 0);
  const validMoveHexKeys = useMemo(
    () => new Set(validMoveHexes.map(hexCoordsKey)),
    [validMoveHexes],
  );

  const centerX = size.width / 2 - layout.hexWidth / 2;
  const centerY = size.height / 2 - layout.hexHeight / 2;

  const cellRenderData = useMemo(
    () =>
      cells.map((cell) => {
        const { q, r } = cell.coordinates;
        const cellCoords = { q, r };
        const isFocus = q === focus.q && r === focus.r;
        const offset = isFocus
          ? { x: 0, y: 0 }
          : getToroidalHexScreenOffset(focus, cellCoords, layout, radius);

        return {
          cell,
          cellCoords,
          isFocus,
          left: centerX + offset.x,
          top: centerY + offset.y,
          hexUnits: unitsByHex.get(`${q},${r}`) ?? [],
          hexConstructionSites: constructionSitesForHex(constructionSites, cellCoords),
          isMoveTarget: moveModeActive && validMoveHexKeys.has(hexCoordsKey(cellCoords)),
          isNeighborClickable:
            !isFocus && onNeighborClick != null && !moveModeActive && !buildModeActive,
          showMarker:
            pendingMoveDestination != null &&
            coordsMatch(pendingMoveDestination.hex_coords, cellCoords),
          cellClassName: [
            'hex-grid__cell',
            isFocus ? 'hex-grid__cell--focus' : 'hex-grid__cell--neighbor',
            !isFocus && onNeighborClick != null && !moveModeActive && !buildModeActive
              ? 'hex-grid__cell--clickable'
              : '',
            buildModeActive && isFocus ? 'hex-grid__cell--build-target' : '',
          ]
            .filter(Boolean)
            .join(' '),
          surfaceHostClassName: [
            'hex-grid__cell-surface-host',
            isFocus ? 'hex-grid__cell-surface-host--focus' : 'hex-grid__cell-surface-host--neighbor',
          ]
            .filter(Boolean)
            .join(' '),
        };
      }),
    [
      cells,
      focus,
      layout,
      radius,
      centerX,
      centerY,
      unitsByHex,
      constructionSites,
      moveModeActive,
      validMoveHexKeys,
      onNeighborClick,
      buildModeActive,
      pendingMoveDestination,
    ],
  );

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
    buildModeActive ? 'hex-grid-viewport--build-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleCellClick = (
    event: MouseEvent<HTMLDivElement>,
    cellCoords: HexCoords,
    hexUnits: UnitInstance[],
    isMoveTarget: boolean,
    isFocus: boolean,
  ) => {
    if (moveModeActive && isMoveTarget) {
      const position = clientPointToHexLocalPosition(event.currentTarget, event.clientX, event.clientY);
      if (position != null && !isPointOnBuildingFootprint(position, hexUnits)) {
        onMoveDestinationSelect?.(cellCoords, position);
      }
      return;
    }

    if (!isFocus && onNeighborClick != null) {
      onNeighborClick(cellCoords);
    }
  };

  const handleUnitMarkerSelect = useCallback(
    (cellCoords: HexCoords, isFocus: boolean, unit: UnitInstance) => {
      if (moveModeActive || buildModeActive) {
        return;
      }

      if (isFocus) {
        onUnitSelect?.(unit);
        return;
      }

      if (onNeighborUnitSelect != null) {
        onNeighborUnitSelect(cellCoords, unit);
        return;
      }

      onNeighborClick?.(cellCoords);
    },
    [buildModeActive, moveModeActive, onNeighborClick, onNeighborUnitSelect, onUnitSelect],
  );

  const unitSelectionEnabled =
    !moveModeActive && !buildModeActive && (onUnitSelect != null || onNeighborUnitSelect != null);

  return (
    <div ref={ref} className={viewportClassName} style={viewportStyle}>
      {isReady ? (
        <div className="hex-grid hex-grid--focus-cluster" style={clusterStyle}>
          {cellRenderData.map(({ cell, cellCoords, left, top, surfaceHostClassName }) => {
              const { q, r } = cellCoords;

              return (
                <div
                  key={`surface-${q},${r}`}
                  className={surfaceHostClassName}
                  style={{ left, top }}
                  data-q={q}
                  data-r={r}
                  aria-hidden="true"
                >
                  <div
                    className="hex-grid__cell-surface"
                    style={{
                      backgroundColor: getBiomeColor(cell.biome),
                      backgroundImage: `url(${getBiomeTileset(cell.biome)})`,
                    }}
                  />
                </div>
              );
            },
          )}
          {cellRenderData.map(
            ({
              cellCoords,
              isFocus,
              left,
              top,
              hexUnits,
              hexConstructionSites,
              isMoveTarget,
              isNeighborClickable,
              showMarker,
              cellClassName,
            }) => {
              const { q, r } = cellCoords;

              return (
                <div
                  key={`layer-${q},${r}`}
                  className={cellClassName}
                  style={{ left, top }}
                  data-q={q}
                  data-r={r}
                  onClick={(event) =>
                    handleCellClick(event, cellCoords, hexUnits, isMoveTarget, isFocus)
                  }
                  onKeyDown={
                    isNeighborClickable
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onNeighborClick?.(cellCoords);
                          }
                        }
                      : undefined
                  }
                  role={isNeighborClickable ? 'button' : undefined}
                  tabIndex={isNeighborClickable ? 0 : undefined}
                  aria-label={!isFocus ? `Neighbor hex (${q}, ${r})` : undefined}
                >
                  <div className="hex-grid__cell-layer">
                    <HexUnitMarkers
                      units={hexUnits}
                      playerId={playerId}
                      ownUnitMarker="sprite"
                      selectable={unitSelectionEnabled}
                      selectedUnitId={selectedUnitId}
                      onUnitSelect={(unit) => handleUnitMarkerSelect(cellCoords, isFocus, unit)}
                    />
                    {hexConstructionSites.map((site) => (
                      <ConstructionSiteOverlay
                        key={site.builderUnitId}
                        site={site}
                        nowMs={nowMs}
                      />
                    ))}
                    {buildModeActive && isFocus ? (
                      <BuildTargetOverlay
                        footprintCells={buildFootprintCells}
                        pendingBuildingZoneId={pendingBuildingZoneId}
                        onSelect={(buildingZoneId) => onBuildTargetSelect?.(buildingZoneId)}
                      />
                    ) : null}
                    {garageAreaPreview != null && isFocus ? (
                      <GarageAreaOverlay
                        center={garageAreaPreview.center}
                        radiusHex={garageAreaPreview.radiusHex}
                        layout={layout}
                      />
                    ) : null}
                    {showMarker ? (
                      <MoveDestinationMarker position={pendingMoveDestination!.position} />
                    ) : null}
                  </div>
                </div>
              );
            },
          )}
          <MovingUnitsOverlay
            units={planetUnits}
            movementTracks={movementTracks}
            focus={focus}
            radius={radius}
            visibleHexKeys={visibleHexKeys}
            clusterTopLeft={{ x: centerX, y: centerY }}
            clusterSize={{ width: size.width, height: size.height }}
            layout={layout}
            nowMs={nowMs}
            selectedUnitId={selectedUnitId}
          />
        </div>
      ) : null}
    </div>
  );
}
