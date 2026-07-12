import { useCallback, useEffect, useRef, useState } from 'react';
import { planetSocketService } from '../services/planetSocketService';
import { unitService } from '../services/unitService';
import type { UnitUpdatePayload } from '../types/socket';
import type { UnitInstance } from '../types/unit';
import { applyUnitUpdate, getUnitsSourceSignature } from '../utils/unitLocation';

export interface PlanetUnitsWithSocket {
  units: UnitInstance[];
  patchUnit: (payload: UnitUpdatePayload) => void;
}

/** Joins the planet Socket.IO room and merges live UNIT_UPDATE events into unit state. */
export function usePlanetUnitsWithSocket(
  planetId: string | null | undefined,
  sourceUnits: UnitInstance[],
  onUnitUpdate?: (payload: UnitUpdatePayload) => void,
): PlanetUnitsWithSocket {
  const [units, setUnits] = useState<UnitInstance[]>(sourceUnits);
  const syncedPlanetIdRef = useRef<string | null>(null);
  const prevSourceSignatureRef = useRef('');
  const refetchInFlightRef = useRef<Promise<void> | null>(null);
  const onUnitUpdateRef = useRef(onUnitUpdate);
  onUnitUpdateRef.current = onUnitUpdate;

  const refetchPlanetUnits = useCallback(async (trimmedPlanetId: string) => {
    if (refetchInFlightRef.current != null) {
      return refetchInFlightRef.current;
    }

    const promise = unitService
      .listPlanetUnits(trimmedPlanetId)
      .then((freshUnits) => {
        setUnits(freshUnits);
      })
      .catch(() => {
        // Keep the current unit list when the refresh fails.
      })
      .finally(() => {
        refetchInFlightRef.current = null;
      });

    refetchInFlightRef.current = promise;
    return promise;
  }, []);

  const patchUnit = useCallback(
    (payload: UnitUpdatePayload) => {
      const trimmedPlanetId = planetId?.trim() ?? null;

      setUnits((current) => {
        if (current.some((unit) => unit.id === payload.unitId)) {
          return applyUnitUpdate(current, payload);
        }

        if (trimmedPlanetId != null) {
          void refetchPlanetUnits(trimmedPlanetId);
        }

        return current;
      });
      onUnitUpdateRef.current?.(payload);
    },
    [planetId, refetchPlanetUnits],
  );

  useEffect(() => {
    const trimmedPlanetId = planetId?.trim() ?? null;
    const signature = getUnitsSourceSignature(sourceUnits);

    if (syncedPlanetIdRef.current !== trimmedPlanetId) {
      syncedPlanetIdRef.current = trimmedPlanetId;
      prevSourceSignatureRef.current = signature;
      setUnits(sourceUnits);
      return;
    }

    if (signature !== prevSourceSignatureRef.current) {
      prevSourceSignatureRef.current = signature;
      setUnits(sourceUnits);
    }
  }, [planetId, sourceUnits]);

  useEffect(() => {
    const trimmedPlanetId = planetId?.trim();
    if (trimmedPlanetId == null || trimmedPlanetId.length === 0) {
      return;
    }

    let active = true;

    void planetSocketService.joinPlanet(trimmedPlanetId).then(() => {
      if (!active) {
        planetSocketService.leavePlanet();
      }
    });

    return () => {
      active = false;
      planetSocketService.leavePlanet();
    };
  }, [planetId]);

  useEffect(() => {
    return planetSocketService.subscribeUnitUpdate(patchUnit);
  }, [patchUnit]);

  return { units, patchUnit };
}
