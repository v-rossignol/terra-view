import { useMemo } from 'react';
import type { PlanetHexResources } from '../types/resource';
import type { UnitInstance } from '../types/unit';
import { withProjectedExtractionCargo } from '../utils/unitExtraction';
import { useAnimationNow } from './useAnimationNow';

export function useUnitsWithProjectedExtractionCargo(
  units: UnitInstance[],
  hexResources: PlanetHexResources | null,
): UnitInstance[] {
  const hasExtractingUnits = useMemo(
    () => units.some((unit) => unit.status === 'extracting'),
    [units],
  );
  const nowMs = useAnimationNow(hasExtractingUnits);

  return useMemo(() => {
    if (!hasExtractingUnits) {
      return units;
    }

    return units.map((unit) => withProjectedExtractionCargo(unit, hexResources, nowMs));
  }, [units, hexResources, nowMs, hasExtractingUnits]);
}
