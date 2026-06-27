import { useCallback, useEffect, useRef, useState } from 'react';
import { planetSocketService } from '../services/planetSocketService';
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
  const sourceSignatureRef = useRef('');
  const syncedPlanetIdRef = useRef<string | null>(null);
  const onUnitUpdateRef = useRef(onUnitUpdate);
  onUnitUpdateRef.current = onUnitUpdate;

  const patchUnit = useCallback((payload: UnitUpdatePayload) => {
    setUnits((current) => applyUnitUpdate(current, payload));
    onUnitUpdateRef.current?.(payload);
  }, []);

  useEffect(() => {
    const trimmedPlanetId = planetId?.trim() ?? null;
    const signature = getUnitsSourceSignature(sourceUnits);

    if (syncedPlanetIdRef.current !== trimmedPlanetId) {
      syncedPlanetIdRef.current = trimmedPlanetId;
      sourceSignatureRef.current = signature;
      setUnits(sourceUnits);
      return;
    }

    if (signature !== sourceSignatureRef.current) {
      sourceSignatureRef.current = signature;
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
