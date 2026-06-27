import { useEffect, useRef, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HexCoords } from '../types/planet';
import type { UnitInstance, UnitMovementTrack } from '../types/unit';
import { useAnimationNow } from './useAnimationNow';
import { getFollowHexForSelectedMovingUnit, isMovingVehicule } from '../utils/unitMovementTrack';

export interface FollowSelectedMovingUnitOptions {
  planetId: string | null | undefined;
  coords: HexCoords | null | undefined;
  selectedUnit: UnitInstance | null;
  movementTracks: Readonly<Record<string, UnitMovementTrack>>;
}

/** Keeps the hex view centered on a selected vehicule while it crosses hex boundaries. */
export function useFollowSelectedMovingUnit({
  planetId,
  coords,
  selectedUnit,
  movementTracks,
}: FollowSelectedMovingUnitOptions): MutableRefObject<boolean> {
  const navigate = useNavigate();
  const skipHexResetRef = useRef(false);
  const selectedIsMoving = selectedUnit != null && isMovingVehicule(selectedUnit);
  const nowMs = useAnimationNow(selectedIsMoving);

  useEffect(() => {
    const trimmedPlanetId = planetId?.trim();
    if (trimmedPlanetId == null || trimmedPlanetId.length === 0 || coords == null || !selectedIsMoving) {
      return;
    }

    const followHex = getFollowHexForSelectedMovingUnit(
      selectedUnit,
      movementTracks,
      coords,
      nowMs,
    );

    if (followHex == null) {
      return;
    }

    skipHexResetRef.current = true;
    navigate(`/${trimmedPlanetId}/${followHex.q}/${followHex.r}`);
  }, [
    planetId,
    coords,
    selectedUnit,
    selectedIsMoving,
    movementTracks,
    nowMs,
    navigate,
  ]);

  return skipHexResetRef;
}
