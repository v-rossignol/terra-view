import { formatDuration } from '@infinity/shared-utils';
import { useEffect, useState } from 'react';
import { unitService } from '../../services/unitService';
import type { HexCoords } from '../../types/planet';
import type { BuildableUnitType, UnitInstance } from '../../types/unit';
import { getErrorMessage } from '../../utils/helpers';

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
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid #3a3a3a',
  backgroundColor: 'rgba(20, 20, 20, 0.98)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55)',
  fontSize: '0.8125rem',
  lineHeight: 1.45,
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 0.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#7eb8ff',
};

const listStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.75rem',
  padding: '0.2rem 0',
  color: '#e0e0e0',
};

const detailStyle: React.CSSProperties = {
  color: '#9a9a9a',
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: '#9a9a9a',
};

const errorStyle: React.CSSProperties = {
  margin: '0.5rem 0 0',
  color: '#ff6b6b',
  fontSize: '0.75rem',
  lineHeight: 1.35,
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
}

function formatUnitCategory(type: BuildableUnitType): string {
  return type.type === 'building' ? 'Building' : 'Vehicule';
}

export function BuildingPanel({ unit, planetId, hexCoords, onClose }: BuildingPanelProps) {
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
        <aside style={panelStyle}>
          <p style={titleStyle}>{unit.type.name} - Building</p>
          {isLoading ? <p style={mutedStyle}>Loading buildable units…</p> : null}
          {!isLoading && loadError != null ? (
            <p style={errorStyle} role="alert">
              {loadError}
            </p>
          ) : null}
          {!isLoading && loadError == null && buildableUnits.length === 0 ? (
            <p style={mutedStyle}>No buildable units on this hex.</p>
          ) : null}
          {!isLoading && loadError == null && buildableUnits.length > 0 ? (
            <ul style={listStyle}>
              {buildableUnits.map((buildableUnit) => (
                <li key={buildableUnit.id} style={itemStyle}>
                  <span>
                    {buildableUnit.name}
                    <span style={{ ...detailStyle, marginLeft: '0.35rem' }}>
                      ({formatUnitCategory(buildableUnit)}, {buildableUnit.size})
                    </span>
                  </span>
                  <span style={detailStyle}>{formatDuration(buildableUnit.buildDurationMs)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
        <button type="button" style={closeButtonStyle} aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}
