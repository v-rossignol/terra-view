import { UNIT_SIZES, type UnitSize } from '@infinity/shared-config';
import { normalizeGarage } from '@infinity/shared-utils';
import type { UnitInstance } from '../types/unit';
import { countParkedInGarage } from './unitParking';

export interface GarageVehicleEntry {
  id: string;
  typeId: string;
  name: string;
  size: UnitSize | null;
}

export interface GarageSlotSummary {
  size: UnitSize;
  used: number;
  capacity: number;
}

function humanizeTypeId(typeId: string): string {
  return typeId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function listGarageVehicles(
  garage: UnitInstance,
  planetUnits: UnitInstance[],
): GarageVehicleEntry[] {
  const unitsById = new Map(planetUnits.map((unit) => [unit.id, unit]));

  return Object.values(normalizeGarage(garage.garage))
    .map((entry) => {
      const unit = unitsById.get(entry.id);

      return {
        id: entry.id,
        typeId: entry.typeId,
        name: unit?.type.name ?? humanizeTypeId(entry.typeId),
        size: unit?.type.size ?? null,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function summarizeGarageSlots(
  garage: UnitInstance,
  planetUnits: UnitInstance[],
): GarageSlotSummary[] {
  const capability = garage.type.capabilities.garage;

  if (capability == null) {
    return [];
  }

  return UNIT_SIZES.flatMap((size) => {
    const capacity = capability[size];

    if (capacity <= 0) {
      return [];
    }

    return [
      {
        size,
        used: countParkedInGarage(planetUnits, garage.id, size),
        capacity,
      },
    ];
  });
}
