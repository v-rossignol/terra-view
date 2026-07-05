import { useEffect } from 'react';
import { computeExtractionYieldPerTick } from '@infinity/shared-utils';
import type { BiomeType } from '../../types/planet';
import type { UnitInstance } from '../../types/unit';
import { getExtractableBiomeResources } from '../../utils/biomeResources';

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

const metaStyle: React.CSSProperties = {
  margin: '0 0 0.5rem',
  color: '#b0b0b0',
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

const yieldStyle: React.CSSProperties = {
  color: '#9a9a9a',
  fontVariantNumeric: 'tabular-nums',
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: '#9a9a9a',
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

const goButtonStyle: React.CSSProperties = {
  padding: '0.15rem 0.45rem',
  borderRadius: '4px',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#3a3a3a',
  backgroundColor: '#2a2a2a',
  color: '#7eb8ff',
  fontSize: '0.6875rem',
  lineHeight: 1.2,
  cursor: 'pointer',
};

const goButtonDisabledStyle: React.CSSProperties = {
  opacity: 0.55,
  cursor: 'not-allowed',
};

const errorStyle: React.CSSProperties = {
  margin: '0.5rem 0 0',
  color: '#ff6b6b',
  fontSize: '0.75rem',
  lineHeight: 1.35,
};

export interface UnitExtractionOverlayProps {
  unit: UnitInstance | null;
  biome: BiomeType | null;
  extractError?: string | null;
  pendingResourceId?: string | null;
  onClose: () => void;
  onStartExtract?: (resourceId: string) => void;
}

function getExtractionTypes(unit: UnitInstance): readonly string[] {
  return unit.type.capabilities.extraction?.types ?? [];
}

function getExtractionSpeed(unit: UnitInstance): number {
  return unit.type.capabilities.extraction?.speed ?? 0;
}

export function UnitExtractionOverlay({
  unit,
  biome,
  extractError = null,
  pendingResourceId = null,
  onClose,
  onStartExtract,
}: UnitExtractionOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (unit == null || biome == null) {
    return null;
  }

  const resources = getExtractableBiomeResources(biome, getExtractionTypes(unit));
  const extractionSpeed = getExtractionSpeed(unit);

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Extraction"
      onClick={onClose}
    >
      <div style={panelShellStyle} onClick={(event) => event.stopPropagation()}>
        <aside style={panelStyle}>
          <p style={titleStyle}>{unit.type.name} - Extraction</p>
          <p style={metaStyle}>
            Biome: <strong style={{ color: '#e0e0e0' }}>{biome}</strong>
          </p>
          {resources.length === 0 ? (
            <p style={mutedStyle}>No extractable resources in this biome.</p>
          ) : (
            <ul style={listStyle}>
              {resources.map((resource) => {
                const isPending = pendingResourceId === resource.id;
                const isDisabled = pendingResourceId != null;

                return (
                  <li key={resource.id} style={itemStyle}>
                    <span>{resource.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={yieldStyle}>
                        {computeExtractionYieldPerTick(resource.quantity, extractionSpeed)} / t.
                      </span>
                      <button
                        type="button"
                        style={
                          isDisabled
                            ? { ...goButtonStyle, ...goButtonDisabledStyle }
                            : goButtonStyle
                        }
                        disabled={isDisabled}
                        aria-label={`Extract ${resource.name}`}
                        onClick={() => onStartExtract?.(resource.id)}
                      >
                        {isPending ? '…' : 'Go'}
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {extractError != null ? (
            <p style={errorStyle} role="alert">
              {extractError}
            </p>
          ) : null}
        </aside>
        <button type="button" style={closeButtonStyle} aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}
