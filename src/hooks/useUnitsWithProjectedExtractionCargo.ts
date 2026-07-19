import { useMemo } from 'react';
import type { UnitInstance } from '../types/unit';
import {
  type HexResourcesByCoords,
  withProjectedExtractionCargo,
} from '../utils/unitExtraction';
import { useAnimationNow } from './useAnimationNow';

export function useUnitsWithProjectedExtractionCargo(
  units: UnitInstance[],
  hexResourcesByCoords: HexResourcesByCoords | null,
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

    return units.map((unit) =>
      withProjectedExtractionCargo(unit, hexResourcesByCoords, nowMs),
    );
  }, [units, hexResourcesByCoords, nowMs, hasExtractingUnits]);
}
