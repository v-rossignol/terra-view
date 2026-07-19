import type { HexCoords } from '../../types/planet';
import type { UnitInstance, UnitMovementTrack } from '../../types/unit';
import {
  computeMovementDirectionDegrees,
  computeMovementProgress,
  computeMovementWorldPosition,
  planetSurfaceToWorldPoint,
  worldPointToClusterScreen,
} from '../../utils/planetSurfaceTravel';
import {
  isMovementVisibleInCluster,
  isMovingVehicule,
  resolveUnitMovementTrack,
} from '../../utils/unitMovementTrack';
import { getUnitSprite } from '../../utils/unitSprites';
import type { HexLayoutConfig } from '../../utils/hexLayout';

/** Unit sprites face the top of the image; offset atan2 direction to match art. */
const UNIT_SPRITE_FACING_OFFSET_DEG = 90;

export interface MovingUnitsOverlayProps {
  units: UnitInstance[];
  movementTracks: Readonly<Record<string, UnitMovementTrack>>;
  focus: HexCoords;
  radius: number;
  visibleHexKeys: ReadonlySet<string>;
  clusterTopLeft: { x: number; y: number };
  clusterSize: { width: number; height: number };
  layout: HexLayoutConfig;
  nowMs: number;
  selectedUnitId?: string | null;
  selectable?: boolean;
  onUnitSelect?: (unit: UnitInstance) => void;
}

interface AnimatedUnitRender {
  unit: UnitInstance;
  track: UnitMovementTrack;
  currentX: number;
  currentY: number;
  destinationX: number;
  destinationY: number;
  rotationDeg: number;
}

function buildAnimatedUnits(
  units: UnitInstance[],
  movementTracks: Readonly<Record<string, UnitMovementTrack>>,
  focus: HexCoords,
  radius: number,
  visibleHexKeys: ReadonlySet<string>,
  clusterTopLeft: { x: number; y: number },
  layout: HexLayoutConfig,
  nowMs: number,
): AnimatedUnitRender[] {
  const rendered: AnimatedUnitRender[] = [];

  for (const unit of units) {
    if (!isMovingVehicule(unit)) {
      continue;
    }

    const track = resolveUnitMovementTrack(unit, movementTracks);
    if (track == null || !isMovementVisibleInCluster(track, visibleHexKeys)) {
      continue;
    }

    const progress = computeMovementProgress(track.startAt, track.arrivalAt, nowMs);
    const worldPosition = computeMovementWorldPosition(
      track.origin,
      track.destination,
      progress,
      radius,
      layout,
    );
    const destinationWorld = planetSurfaceToWorldPoint(
      track.destination.hex,
      track.destination.position,
      layout,
    );
    const currentScreen = worldPointToClusterScreen(
      worldPosition,
      focus,
      clusterTopLeft,
      radius,
      layout,
    );
    const destinationScreen = worldPointToClusterScreen(
      destinationWorld,
      focus,
      clusterTopLeft,
      radius,
      layout,
    );

    rendered.push({
      unit,
      track,
      currentX: currentScreen.x,
      currentY: currentScreen.y,
      destinationX: destinationScreen.x,
      destinationY: destinationScreen.y,
      rotationDeg: computeMovementDirectionDegrees(
        track.origin,
        track.destination,
        radius,
        layout,
        UNIT_SPRITE_FACING_OFFSET_DEG,
      ),
    });
  }

  return rendered;
}

export function MovingUnitsOverlay({
  units,
  movementTracks,
  focus,
  radius,
  visibleHexKeys,
  clusterTopLeft,
  clusterSize,
  layout,
  nowMs,
  selectedUnitId = null,
  selectable = false,
  onUnitSelect,
}: MovingUnitsOverlayProps) {
  const animatedUnits = buildAnimatedUnits(
    units,
    movementTracks,
    focus,
    radius,
    visibleHexKeys,
    clusterTopLeft,
    layout,
    nowMs,
  );

  if (animatedUnits.length === 0) {
    return null;
  }

  const overlayClassName = [
    'hex-grid__moving-overlay',
    selectable ? 'hex-grid__moving-overlay--selectable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={overlayClassName}
      style={{ width: clusterSize.width, height: clusterSize.height }}
      aria-hidden={selectable ? undefined : true}
    >
      <svg
        className="hex-grid__moving-paths"
        width={clusterSize.width}
        height={clusterSize.height}
        aria-hidden="true"
      >
        {animatedUnits.map(({ unit, currentX, currentY, destinationX, destinationY }) => (
          <line
            key={unit.id}
            x1={currentX}
            y1={currentY}
            x2={destinationX}
            y2={destinationY}
            className="hex-grid__moving-path"
          />
        ))}
      </svg>
      {animatedUnits.map(({ unit, currentX, currentY, rotationDeg }) => {
        const sprite = getUnitSprite(unit.typeId);
        const isSelected = selectedUnitId === unit.id;
        const unitClassName = [
          'hex-grid__unit',
          'hex-grid__unit--overlay',
          sprite != null ? 'hex-grid__unit--sprite' : 'hex-grid__unit--vehicule',
          isSelected ? 'hex-grid__unit--selected' : '',
          selectable ? 'hex-grid__unit--selectable' : '',
          'hex-grid__unit--moving',
        ]
          .filter(Boolean)
          .join(' ');

        const commonProps = {
          className: unitClassName,
          style: {
            left: `${currentX}px`,
            top: `${currentY}px`,
            transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
            ...(sprite != null ? { backgroundImage: `url(${sprite})` } : {}),
          },
          title: unit.type.name,
          'aria-label': unit.type.name,
          'aria-pressed': selectable ? isSelected : undefined,
        };

        if (selectable) {
          return (
            <button
              key={unit.id}
              type="button"
              {...commonProps}
              onClick={(event) => {
                event.stopPropagation();
                onUnitSelect?.(unit);
              }}
            />
          );
        }

        return <span key={unit.id} {...commonProps} />;
      })}
    </div>
  );
}
