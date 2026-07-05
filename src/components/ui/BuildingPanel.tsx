import { BuildableUnitsPanel } from '@infinity/shared-ui';
import { useEffect, useState } from 'react';
import { unitService } from '../../services/unitService';
import type { HexCoords } from '../../types/planet';
import type { BuildableUnitType, UnitInstance } from '../../types/unit';
import { getErrorMessage } from '../../utils/helpers';
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

const panelStyle: React.CSSProperties = {
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

export interface BuildingPanelProps {
  unit: UnitInstance | null;
  planetId: string | null;
  hexCoords: HexCoords | null;
  onClose: () => void;
  onBuild?: (unit: BuildableUnitType) => void;
  isBuildable?: (unit: BuildableUnitType) => boolean;
}

export function BuildingPanel({
  unit,
  planetId,
  hexCoords,
  onClose,
  onBuild,
  isBuildable,
}: BuildingPanelProps) {
  const [buildableUnits, setBuildableUnits] = useState<BuildableUnitType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (unit == null) {
      return;
    }

    let cancelled = false;

    const loadBuildableUnits = async () => {
      setIsLoading(true);
      setLoadError(null);
      setBuildableUnits([]);

      try {
        const query =
          planetId != null && hexCoords != null
            ? { planetId, q: hexCoords.q, r: hexCoords.r }
            : {};
        const units = await unitService.listBuildableUnitTypes(unit.id, query);

        if (cancelled) {
          return;
        }

        setBuildableUnits(units);
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        setLoadError(getErrorMessage(error, 'Failed to load buildable units.'));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadBuildableUnits();

    return () => {
      cancelled = true;
    };
  }, [unit, planetId, hexCoords?.q, hexCoords?.r]);

  if (unit == null) {
    return null;
  }

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Building"
      onClick={onClose}
    >
      <div style={panelShellStyle} onClick={(event) => event.stopPropagation()}>
        <BuildableUnitsPanel
          title={`${unit.type.name} - Building`}
          units={buildableUnits}
          resourceNames={getTerrainResourceNames()}
          onBuild={onBuild}
          isBuildable={isBuildable}
          isLoading={isLoading}
          loadError={loadError}
          style={panelStyle}
        />
        <button type="button" style={closeButtonStyle} aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}
