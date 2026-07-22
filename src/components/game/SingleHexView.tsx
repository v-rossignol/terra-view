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
import { resolveClusterHexClick } from '../../utils/hexLocalPosition';
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
  fitFocusClusterLayout,
  getFocusClusterTopLeft,
  getToroidalHexScreenOffset,
  type HexLayoutConfig,
} from '../../utils/hexLayout';
import './HexGrid.css';

import type { MapZoomLevel } from '../../types/map';
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
  outerNeighbors?: PlanetHexagon[];
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
  zoomLevel?: MapZoomLevel;
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
  outerNeighbors = [],
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
  zoomLevel = 1,
}: SingleHexViewProps) {
  const { ref, size } = useContainerSize<HTMLDivElement>();
  const focus = hex.coordinates;
  const neighborCoords = useMemo(
    () => neighbors.map((neighbor) => neighbor.coordinates),
    [neighbors],
  );
  const neighborCoordKeys = useMemo(
    () => new Set(neighbors.map((neighbor) => hexCoordsKey(neighbor.coordinates))),
    [neighbors],
  );
  const outerNeighborCoordKeys = useMemo(
    () => new Set(outerNeighbors.map((neighbor) => hexCoordsKey(neighbor.coordinates))),
    [outerNeighbors],
  );
  const layout = useMemo(() => {
    if (zoomLevel === 2) {
      return fitFocusClusterLayout(size, baseLayout, focus, neighborCoords, radius);
    }

    return fitFocusHexLayout(size, baseLayout);
  }, [zoomLevel, size, baseLayout, focus, neighborCoords, radius]);
  const scale = layout.hexWidth / baseLayout.hexWidth;
  const isReady = size.width > 0 && size.height > 0 && scale > 0;
  const cells = useMemo(() => {
    if (zoomLevel === 2) {
      return [hex, ...neighbors, ...outerNeighbors];
    }

    return [hex, ...neighbors];
  }, [hex, neighbors, outerNeighbors, zoomLevel]);
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

  const clusterTopLeft = useMemo(() => {
    if (zoomLevel === 2) {
      return getFocusClusterTopLeft(size, layout, focus, neighborCoords, radius);
    }

    return {
      x: size.width / 2 - layout.hexWidth / 2,
      y: size.height / 2 - layout.hexHeight / 2,
    };
  }, [zoomLevel, size, layout, focus, neighborCoords, radius]);
  const centerX = clusterTopLeft.x;
  const centerY = clusterTopLeft.y;

  const cellRenderData = useMemo(
    () =>
      cells.map((cell) => {
        const { q, r } = cell.coordinates;
        const cellCoords = { q, r };
        const isFocus = q === focus.q && r === focus.r;
        const isOuter = !isFocus && outerNeighborCoordKeys.has(hexCoordsKey(cellCoords));
        const isNeighbor = !isFocus && neighborCoordKeys.has(hexCoordsKey(cellCoords));
        const offset = isFocus
          ? { x: 0, y: 0 }
          : getToroidalHexScreenOffset(focus, cellCoords, layout, radius);

        return {
          cell,
          cellCoords,
          isFocus,
          isOuter,
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
            isFocus
              ? 'hex-grid__cell--focus'
              : isOuter
                ? 'hex-grid__cell--outer'
                : isNeighbor
                  ? 'hex-grid__cell--neighbor'
                  : 'hex-grid__cell--neighbor',
            !isFocus && onNeighborClick != null && !moveModeActive && !buildModeActive
              ? 'hex-grid__cell--clickable'
              : '',
            buildModeActive && isFocus ? 'hex-grid__cell--build-target' : '',
          ]
            .filter(Boolean)
            .join(' '),
          surfaceHostClassName: [
            'hex-grid__cell-surface-host',
            isFocus
              ? 'hex-grid__cell-surface-host--focus'
              : isOuter
                ? 'hex-grid__cell-surface-host--outer'
                : 'hex-grid__cell-surface-host--neighbor',
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
      neighborCoordKeys,
      outerNeighborCoordKeys,
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

  const handleClusterClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const resolved = resolveClusterHexClick(
        cellRenderData,
        layout.hexWidth,
        layout.hexHeight,
        event.currentTarget.getBoundingClientRect(),
        event.clientX,
        event.clientY,
      );

      if (resolved == null) {
        return;
      }

      const { cell, position } = resolved;

      if (moveModeActive) {
        if (!cell.isMoveTarget) {
          return;
        }

        if (!isPointOnBuildingFootprint(position, cell.hexUnits)) {
          onMoveDestinationSelect?.(cell.cellCoords, position);
        }
        return;
      }

      if (!cell.isFocus && cell.isNeighborClickable && onNeighborClick != null) {
        onNeighborClick(cell.cellCoords);
      }
    },
    [cellRenderData, layout.hexWidth, layout.hexHeight, moveModeActive, onMoveDestinationSelect, onNeighborClick],
  );

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

  const viewportClassName = [
    'hex-grid-viewport',
    'hex-grid-viewport--focus',
    zoomLevel === 2 ? 'hex-grid-viewport--zoom-2' : '',
    moveModeActive ? 'hex-grid-viewport--move-mode' : '',
    buildModeActive ? 'hex-grid-viewport--build-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={viewportClassName} style={viewportStyle}>
      {isReady ? (
        <div
          className="hex-grid hex-grid--focus-cluster"
          style={clusterStyle}
          onClick={handleClusterClick}
        >
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
            selectable={unitSelectionEnabled}
            onUnitSelect={onUnitSelect}
          />
        </div>
      ) : null}
    </div>
  );
}
