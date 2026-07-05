import { useEffect } from 'react';
import { CargoPanel, type CargoResource } from '@infinity/shared-ui';
import type { UnitInstance } from '../../types/unit';
import { getTerrainResourceNames } from '../../utils/resourceNames';

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
  width: 'min(22rem, calc(100vw - 2rem))',
  maxWidth: '100%',
};

const cargoPanelStyle: React.CSSProperties = {
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

export interface UnitCargoOverlayProps {
  unit: UnitInstance | null;
  onClose: () => void;
  onDrop?: (resource: CargoResource) => void;
  droppingResourceId?: string | null;
}

function getUnitCargoCapacity(unit: UnitInstance): number | undefined {
  return unit.type.capabilities.cargo?.size;
}

export function UnitCargoOverlay({ unit, onClose, onDrop, droppingResourceId = null }: UnitCargoOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (unit == null) {
    return null;
  }

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label={`${unit.type.name} cargo`}
      onClick={onClose}
    >
      <div style={panelShellStyle} onClick={(event) => event.stopPropagation()}>
        <CargoPanel
          title={unit.type.name}
          cargo={unit.cargo}
          capacity={getUnitCargoCapacity(unit)}
          resourceNames={getTerrainResourceNames()}
          onDrop={onDrop}
          droppingResourceId={droppingResourceId}
          style={cargoPanelStyle}
        />
        <button type="button" style={closeButtonStyle} aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}
