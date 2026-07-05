import type { UnitSize } from '@infinity/shared-config';
import type { UnitInstance } from '../types/unit';
import { getUnitHexCoords, getUnitHexLocalPosition } from './unitLocation';
import { isWithinGarageRange, type GarageRangePoint } from './unitGarageRange';

export interface ParkableGarage {
  unitId: string;
  name: string;
}

function parseParkingGarageUnitId(metadata: Record<string, unknown>): string | null {
  const raw = metadata.parking;
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const garageUnitId = (raw as Record<string, unknown>).garageUnitId;
  return typeof garageUnitId === 'string' ? garageUnitId : null;
}

export function isParkedVehicle(unit: UnitInstance): boolean {
  return (
    unit.type.type === 'vehicule' &&
    unit.status === 'inactive' &&
    parseParkingGarageUnitId(unit.metadata) != null
  );
}

export function countParkedInGarage(
  planetUnits: UnitInstance[],
  garageUnitId: string,
  vehicleSize: UnitSize,
): number {
  let count = 0;

  for (const unit of planetUnits) {
    if (unit.status !== 'inactive' || unit.type.size !== vehicleSize) {
      continue;
    }

    if (parseParkingGarageUnitId(unit.metadata) === garageUnitId) {
      count += 1;
    }
  }

  return count;
}

function resolveSurfacePoint(unit: UnitInstance): GarageRangePoint | null {
  const hex = getUnitHexCoords(unit);
  const position = getUnitHexLocalPosition(unit);

  if (hex == null || position == null) {
    return null;
  }

  return { hex, position };
}

function getGarageSlotCapacity(garage: UnitInstance, vehicleSize: UnitSize): number {
  return garage.type.capabilities.garage?.[vehicleSize] ?? 0;
}

function isEligibleGarageCandidate(
  garage: UnitInstance,
  vehicle: UnitInstance,
  playerId: string,
): boolean {
  if (garage.id === vehicle.id) {
    return false;
  }

  if (garage.ownerId !== playerId || garage.type.type !== 'building' || garage.status !== 'idle') {
    return false;
  }

  if (garage.type.capabilities.garage == null) {
    return false;
  }

  return getGarageSlotCapacity(garage, vehicle.type.size) > 0;
}

export function findParkableGarages(
  vehicle: UnitInstance,
  planetUnits: UnitInstance[],
  planetRadius: number,
  playerId: string,
): ParkableGarage[] {
  if (
    vehicle.ownerId !== playerId ||
    vehicle.type.type !== 'vehicule' ||
    vehicle.status !== 'idle'
  ) {
    return [];
  }

  const vehiclePoint = resolveSurfacePoint(vehicle);
  if (vehiclePoint == null) {
    return [];
  }

  const results: ParkableGarage[] = [];

  for (const garage of planetUnits) {
    if (!isEligibleGarageCandidate(garage, vehicle, playerId)) {
      continue;
    }

    const slotCapacity = getGarageSlotCapacity(garage, vehicle.type.size);
    const parkedCount = countParkedInGarage(planetUnits, garage.id, vehicle.type.size);
    if (parkedCount >= slotCapacity) {
      continue;
    }

    const garagePoint = resolveSurfacePoint(garage);
    if (garagePoint == null) {
      continue;
    }

    if (!isWithinGarageRange(vehiclePoint, garagePoint, planetRadius)) {
      continue;
    }

    results.push({
      unitId: garage.id,
      name: garage.type.name,
    });
  }

  return results;
}
