import type { UnitInstance, UnitInstanceStatus } from '../../types/unit';

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  left: '1rem',
  top: '1rem',
  width: 'min(18rem, calc(100% - 2rem))',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  border: '1px solid #3a3a3a',
  backgroundColor: 'rgba(20, 20, 20, 0.95)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
  fontSize: '0.8125rem',
  lineHeight: 1.45,
  zIndex: 10,
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 0.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#7eb8ff',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '0.35rem',
  marginTop: '0.75rem',
  paddingTop: '0.75rem',
  borderTop: '1px solid #3a3a3a',
};

const actionButtonStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  borderRadius: '4px',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#3a3a3a',
  backgroundColor: '#2a2a2a',
  color: '#e0e0e0',
  fontSize: '0.75rem',
  lineHeight: 1.2,
  cursor: 'pointer',
};

const metaStyle: React.CSSProperties = {
  margin: '0 0 0.5rem',
  color: '#b0b0b0',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 0.35rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#9a9a9a',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const listStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const itemStyle: React.CSSProperties = {
  padding: '0.15rem 0',
  color: '#e0e0e0',
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: '#9a9a9a',
};

function formatStatus(status: UnitInstanceStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusColor(status: UnitInstanceStatus): string {
  if (status === 'moving') {
    return '#6bcf7f';
  }

  return '#e0e0e0';
}

function formatSpeed(speed: number | null, mobility: boolean): string {
  if (!mobility || speed == null) {
    return 'Stationary';
  }

  return String(speed);
}

function formatCapability(key: string, value: unknown): string | null {
  if (value == null || typeof value !== 'object') {
    return null;
  }

  if (key === 'cargo' && 'size' in value && typeof value.size === 'number') {
    return `Cargo capacity: ${value.size}`;
  }

  if (
    key === 'extraction' &&
    'speed' in value &&
    typeof value.speed === 'number' &&
    'types' in value &&
    Array.isArray(value.types)
  ) {
    const types = value.types.map(String).join(', ');
    return `Extraction: speed ${value.speed}, types ${types}`;
  }

  return null;
}

function hasCargoCapability(capabilities: Record<string, unknown>): boolean {
  const cargo = capabilities.cargo;

  return cargo != null && typeof cargo === 'object' && 'size' in cargo && typeof cargo.size === 'number';
}

function hasExtractionCapability(capabilities: Record<string, unknown>): boolean {
  const extraction = capabilities.extraction;

  return (
    extraction != null &&
    typeof extraction === 'object' &&
    'speed' in extraction &&
    typeof extraction.speed === 'number' &&
    'types' in extraction &&
    Array.isArray(extraction.types)
  );
}

function getCapabilityEntries(capabilities: Record<string, unknown>): string[] {
  return Object.entries(capabilities)
    .map(([key, value]) => formatCapability(key, value))
    .filter((entry): entry is string => entry != null);
}

const actionButtonActiveStyle: React.CSSProperties = {
  borderColor: '#7eb8ff',
  backgroundColor: '#1a2a3a',
  color: '#7eb8ff',
};

const actionButtonDisabledStyle: React.CSSProperties = {
  opacity: 0.55,
  cursor: 'not-allowed',
};

const statusRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const stopButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  borderColor: '#6bcf7f',
  color: '#6bcf7f',
};

const moveErrorStyle: React.CSSProperties = {
  margin: '0.5rem 0 0',
  color: '#ff6b6b',
  fontSize: '0.75rem',
  lineHeight: 1.35,
};

export interface UnitPanelProps {
  unit: UnitInstance | null;
  moveModeActive?: boolean;
  moveError?: string | null;
  moveDisabled?: boolean;
  stopDisabled?: boolean;
  onMoveClick?: () => void;
  onStopClick?: () => void;
}

export function UnitPanel({
  unit,
  moveModeActive = false,
  moveError = null,
  moveDisabled = false,
  stopDisabled = false,
  onMoveClick,
  onStopClick,
}: UnitPanelProps) {
  if (unit == null) {
    return null;
  }

  const capabilityEntries = getCapabilityEntries(unit.type.capabilities);
  const showMoveTo = unit.type.mobility;
  const showSeeCargo = hasCargoCapability(unit.type.capabilities);
  const showExtract = hasExtractionCapability(unit.type.capabilities);
  const showActions = showMoveTo || showSeeCargo || showExtract;
  const showStop = unit.status === 'moving' && unit.type.type === 'vehicule';

  return (
    <aside style={panelStyle} aria-label="Unit panel">
      <p style={titleStyle}>{unit.type.name}</p>
      <p style={{ ...metaStyle, ...statusRowStyle }}>
        <span>
          Status: <strong style={{ color: getStatusColor(unit.status) }}>{formatStatus(unit.status)}</strong>
        </span>
        {showStop ? (
          <button
            type="button"
            style={stopDisabled ? { ...stopButtonStyle, ...actionButtonDisabledStyle } : stopButtonStyle}
            disabled={stopDisabled}
            onClick={onStopClick}
          >
            Stop
          </button>
        ) : null}
      </p>
      <p style={metaStyle}>
        Speed: <strong style={{ color: '#e0e0e0' }}>{formatSpeed(unit.type.speed, unit.type.mobility)}</strong>
      </p>
      <p style={sectionTitleStyle}>Capabilities</p>
      {capabilityEntries.length === 0 ? (
        <p style={mutedStyle}>None</p>
      ) : (
        <ul style={listStyle}>
          {capabilityEntries.map((entry) => (
            <li key={entry} style={itemStyle}>
              {entry}
            </li>
          ))}
        </ul>
      )}
      {showActions ? (
        <div style={actionsStyle}>
          {showMoveTo ? (
            <button
              type="button"
              style={
                moveModeActive
                  ? { ...actionButtonStyle, ...actionButtonActiveStyle }
                  : moveDisabled
                    ? { ...actionButtonStyle, ...actionButtonDisabledStyle }
                    : actionButtonStyle
              }
              aria-pressed={moveModeActive}
              disabled={moveDisabled}
              onClick={onMoveClick}
            >
              Move
            </button>
          ) : null}
          {showSeeCargo ? (
            <button type="button" style={actionButtonStyle}>
              Cargo
            </button>
          ) : null}
          {showExtract ? (
            <button type="button" style={actionButtonStyle}>
              Extract
            </button>
          ) : null}
        </div>
      ) : null}
      {moveError != null ? (
        <p style={moveErrorStyle} role="alert">
          {moveError}
        </p>
      ) : null}
    </aside>
  );
}
