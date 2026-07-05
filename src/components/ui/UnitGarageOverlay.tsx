import { GaragePanel, TransferPanel } from '@infinity/shared-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CargoResource, UnitInstance } from '../../types/unit';
import { getTerrainResourceNames } from '../../utils/resourceNames';
import { listGarageVehicles, summarizeGarageSlots } from '../../utils/unitGarage';

export interface TransferCargoParams {
  sourceUnitId: string;
  targetUnitId: string;
  resource: CargoResource;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  zIndex: 20,
};

const panelShellStyle: React.CSSProperties = {
  position: 'relative',
  width: 'min(36rem, calc(100vw - 2rem))',
  maxWidth: '100%',
};

const garagePanelStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55)',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  margin: 0,
  padding: 0,
  border: 'none',
  borderTopRightRadius: '8px',
  backgroundColor: 'transparent',
  color: '#b0b0b0',
  fontSize: '1.25rem',
  lineHeight: 1,
  cursor: 'pointer',
};

export interface UnitGarageOverlayProps {
  unit: UnitInstance | null;
  planetUnits: UnitInstance[];
  onClose: () => void;
  onUnpark?: (vehicleUnitId: string) => void;
  unparkingVehicleId?: string | null;
  onTransferCargo?: (params: TransferCargoParams) => void;
  transferringResourceId?: string | null;
  transferError?: string | null;
}

function getUnitCargoCapacity(unit: UnitInstance): number | undefined {
  return unit.type.capabilities.cargo?.size;
}

export function UnitGarageOverlay({
  unit,
  planetUnits,
  onClose,
  onUnpark,
  unparkingVehicleId = null,
  onTransferCargo,
  transferringResourceId = null,
  transferError = null,
}: UnitGarageOverlayProps) {
  const [transferVehicleId, setTransferVehicleId] = useState<string | null>(null);

  const handleTransferClose = useCallback(() => {
    setTransferVehicleId(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (transferVehicleId != null) {
          setTransferVehicleId(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, transferVehicleId]);

  useEffect(() => {
    setTransferVehicleId(null);
  }, [unit?.id]);

  const vehicles = useMemo(
    () => (unit == null ? [] : listGarageVehicles(unit, planetUnits)),
    [unit, planetUnits],
  );
  const slots = useMemo(
    () => (unit == null ? [] : summarizeGarageSlots(unit, planetUnits)),
    [unit, planetUnits],
  );
  const transferVehicle = useMemo(() => {
    if (transferVehicleId == null) {
      return null;
    }

    return planetUnits.find((candidate) => candidate.id === transferVehicleId) ?? null;
  }, [transferVehicleId, planetUnits]);

  const handleTransferToVehicle = useCallback(
    (resource: CargoResource) => {
      if (unit == null || transferVehicle == null) {
        return;
      }

      onTransferCargo?.({
        sourceUnitId: unit.id,
        targetUnitId: transferVehicle.id,
        resource,
      });
    },
    [onTransferCargo, transferVehicle, unit],
  );

  const handleTransferToGarage = useCallback(
    (resource: CargoResource) => {
      if (unit == null || transferVehicle == null) {
        return;
      }

      onTransferCargo?.({
        sourceUnitId: transferVehicle.id,
        targetUnitId: unit.id,
        resource,
      });
    },
    [onTransferCargo, transferVehicle, unit],
  );

  if (unit == null) {
    return null;
  }

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div style={panelShellStyle} onClick={(event) => event.stopPropagation()}>
        {transferVehicle != null ? (
          <TransferPanel
            buildingName={unit.type.name}
            vehicleName={transferVehicle.type.name}
            buildingCargo={unit.cargo}
            vehicleCargo={transferVehicle.cargo}
            buildingCapacity={getUnitCargoCapacity(unit)}
            vehicleCapacity={getUnitCargoCapacity(transferVehicle)}
            resourceNames={getTerrainResourceNames()}
            onTransferToVehicle={onTransferCargo != null ? handleTransferToVehicle : undefined}
            onTransferToGarage={onTransferCargo != null ? handleTransferToGarage : undefined}
            transferringResourceId={transferringResourceId}
            transferError={transferError}
            onBack={handleTransferClose}
            onClose={onClose}
            style={garagePanelStyle}
          />
        ) : (
          <GaragePanel
            buildingName={unit.type.name}
            vehicles={vehicles}
            slots={slots}
            onUnpark={onUnpark}
            unparkingVehicleId={unparkingVehicleId}
            onTransfer={setTransferVehicleId}
            style={garagePanelStyle}
          />
        )}
        {transferVehicle == null ? (
          <button type="button" style={closeButtonStyle} aria-label="Close" onClick={onClose}>
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
