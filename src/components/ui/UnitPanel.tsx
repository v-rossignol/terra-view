import { UNIT_SIZES } from '@infinity/shared-config';
import { CargoGauge } from '@infinity/shared-ui';
import { getCargoUsed } from '@infinity/shared-utils';
import type { UnitBuildTarget, UnitCapabilities } from '@infinity/shared-types';
import buildingIcon from '../../assets/icons/building.avif';
import extractionIcon from '../../assets/icons/extraction.avif';
import garageIcon from '../../assets/icons/garage.avif';
import moveIcon from '../../assets/icons/move.avif';
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

const listStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const itemStyle: React.CSSProperties = {
  padding: '0.15rem 0',
  color: '#e0e0e0',
};

const capabilityIconsRowStyle: React.CSSProperties = {
  ...itemStyle,
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
};

const capabilityIconButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.25rem',
  flexShrink: 0,
};

const moveIconButtonStyle: React.CSSProperties = {
  ...capabilityIconButtonStyle,
  marginLeft: 'auto',
};

const capabilityIconDisplayStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  cursor: 'help',
};

const capabilityIconImageStyle: React.CSSProperties = {
  width: '3rem',
  height: '3rem',
  display: 'block',
};

const cargoRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
  marginBottom: '0.5rem',
};

const cargoGaugeWrapStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const cargoEyeButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.25rem',
  flexShrink: 0,
  marginTop: '0.35rem',
};

function CargoEyeIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: '#9a9a9a',
};

function formatStatus(status: UnitInstanceStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusColor(status: UnitInstanceStatus): string {
  if (status === 'moving' || status === 'extracting') {
    return '#6bcf7f';
  }

  if (status === 'building') {
    return '#4f8ef7';
  }

  return '#e0e0e0';
}

function formatSpeed(speed: number | null, mobility: boolean): string {
  if (!mobility || speed == null) {
    return 'Stationary';
  }

  return String(speed);
}

function formatBuildTargetCategory(category: string, target: UnitBuildTarget | undefined): string | null {
  if (target == null) {
    return null;
  }

  const sizes = target.sizes.join(', ');
  const units = target.units.join(', ');
  return `${category} sizes ${sizes}, units ${units}`;
}

function formatCapability(key: string, capabilities: UnitCapabilities): string | null {
  if (key === 'cargo') {
    return null;
  }

  if (key === 'extraction') {
    const extraction = capabilities.extraction;

    if (extraction == null) {
      return null;
    }

    const types = extraction.types.join(', ');
    return `Extraction: speed ${extraction.speed}, types ${types}`;
  }

  if (key === 'building') {
    const building = capabilities.building;

    if (building == null) {
      return null;
    }

    const parts = [`speed ${building.speed}`];
    const vehicules = formatBuildTargetCategory('vehicules', building.vehicules);
    const buildings = formatBuildTargetCategory('buildings', building.buildings);

    if (vehicules != null) {
      parts.push(vehicules);
    }

    if (buildings != null) {
      parts.push(buildings);
    }

    return `Building: ${parts.join('; ')}`;
  }

  if (key === 'garage') {
    const garage = capabilities.garage;

    if (garage == null) {
      return null;
    }

    const slots = UNIT_SIZES.filter((size) => garage[size] > 0)
      .map((size) => `${garage[size]} ${size}`)
      .join(', ');

    if (slots.length === 0) {
      return null;
    }

    return `Garage: ${slots}`;
  }

  return null;
}

function getCargoCapacity(capabilities: UnitCapabilities): number | null {
  return capabilities.cargo?.size ?? null;
}

interface CapabilityEntry {
  id: string;
  text: string;
  iconSrc?: string;
}

const CAPABILITY_ICON_ORDER = ['building', 'extraction', 'garage'] as const;

function getCapabilityIconSrc(key: string): string | undefined {
  if (key === 'building') {
    return buildingIcon;
  }

  if (key === 'extraction') {
    return extractionIcon;
  }

  if (key === 'garage') {
    return garageIcon;
  }

  return undefined;
}

function getCapabilityEntries(capabilities: UnitCapabilities): CapabilityEntry[] {
  const entries: CapabilityEntry[] = [];

  for (const key of CAPABILITY_ICON_ORDER) {
    const text = formatCapability(key, capabilities);

    if (text == null) {
      continue;
    }

    entries.push({
      id: key,
      text,
      iconSrc: getCapabilityIconSrc(key),
    });
  }

  return entries;
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

const parkActionRowStyle: React.CSSProperties = {
  ...itemStyle,
  marginTop: '0.25rem',
};

export interface UnitPanelParkTarget {
  garageUnitId: string;
  garageName: string;
}

export interface UnitPanelProps {
  unit: UnitInstance | null;
  moveModeActive?: boolean;
  cargoPanelOpen?: boolean;
  extractPanelOpen?: boolean;
  buildingPanelOpen?: boolean;
  garagePanelOpen?: boolean;
  moveError?: string | null;
  moveDisabled?: boolean;
  extractDisabled?: boolean;
  buildingDisabled?: boolean;
  stopDisabled?: boolean;
  onMoveClick?: () => void;
  onCargoClick?: () => void;
  onExtractClick?: () => void;
  onBuildingClick?: () => void;
  onGarageClick?: () => void;
  onStopClick?: () => void;
  onGarageHoverChange?: (hovered: boolean) => void;
  parkTargets?: ReadonlyArray<UnitPanelParkTarget>;
  parkDisabled?: boolean;
  pendingParkGarageId?: string | null;
  onParkClick?: (garageUnitId: string) => void;
}

export function UnitPanel({
  unit,
  moveModeActive = false,
  cargoPanelOpen = false,
  extractPanelOpen = false,
  buildingPanelOpen = false,
  garagePanelOpen = false,
  moveError = null,
  moveDisabled = false,
  extractDisabled = false,
  buildingDisabled = false,
  stopDisabled = false,
  onMoveClick,
  onCargoClick,
  onExtractClick,
  onBuildingClick,
  onGarageClick,
  onStopClick,
  onGarageHoverChange,
  parkTargets = [],
  parkDisabled = false,
  pendingParkGarageId = null,
  onParkClick,
}: UnitPanelProps) {
  if (unit == null) {
    return null;
  }

  const capabilityEntries = getCapabilityEntries(unit.type.capabilities);
  const iconCapabilityEntries = capabilityEntries.filter((entry) => entry.iconSrc != null);
  const textCapabilityEntries = capabilityEntries.filter((entry) => entry.iconSrc == null);
  const cargoCapacity = getCargoCapacity(unit.type.capabilities);
  const showMoveTo = unit.type.mobility;
  const showIconRow = iconCapabilityEntries.length > 0 || showMoveTo;
  const hasParkTargets = parkTargets.length > 0;
  const hasCapabilityContent = showIconRow || textCapabilityEntries.length > 0 || hasParkTargets;
  const showStop =
    (unit.status === 'moving' && unit.type.type === 'vehicule') ||
    unit.status === 'extracting' ||
    unit.status === 'building';

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
      {unit.type.type !== 'building' ? (
        <p style={metaStyle}>
          Speed: <strong style={{ color: '#e0e0e0' }}>{formatSpeed(unit.type.speed, unit.type.mobility)}</strong>
        </p>
      ) : null}
      {cargoCapacity != null ? (
        <div style={cargoRowStyle}>
          <div style={cargoGaugeWrapStyle}>
            <CargoGauge
              capacity={cargoCapacity}
              used={getCargoUsed(unit.cargo)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <button
            type="button"
            aria-label="View cargo"
            aria-pressed={cargoPanelOpen}
            style={
              cargoPanelOpen
                ? { ...cargoEyeButtonStyle, ...actionButtonActiveStyle }
                : cargoEyeButtonStyle
            }
            onClick={onCargoClick}
          >
            <CargoEyeIcon />
          </button>
        </div>
      ) : null}
      {!hasCapabilityContent ? (
        cargoCapacity == null ? <p style={mutedStyle}>None</p> : null
      ) : (
        <ul style={listStyle}>
          {showIconRow ? (
            <li style={capabilityIconsRowStyle}>
              {iconCapabilityEntries.map((entry) => {
                const icon = (
                  <img src={entry.iconSrc} alt="" aria-hidden style={capabilityIconImageStyle} />
                );

                if (entry.id === 'building') {
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      aria-label={entry.text}
                      title={entry.text}
                      aria-pressed={buildingPanelOpen}
                      disabled={buildingDisabled}
                      style={
                        buildingPanelOpen
                          ? { ...capabilityIconButtonStyle, ...actionButtonActiveStyle }
                          : buildingDisabled
                            ? { ...capabilityIconButtonStyle, ...actionButtonDisabledStyle }
                            : capabilityIconButtonStyle
                      }
                      onClick={onBuildingClick}
                    >
                      {icon}
                    </button>
                  );
                }

                if (entry.id === 'extraction') {
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      aria-label={entry.text}
                      title={entry.text}
                      aria-pressed={extractPanelOpen}
                      disabled={extractDisabled}
                      style={
                        extractPanelOpen
                          ? { ...capabilityIconButtonStyle, ...actionButtonActiveStyle }
                          : extractDisabled
                            ? { ...capabilityIconButtonStyle, ...actionButtonDisabledStyle }
                            : capabilityIconButtonStyle
                      }
                      onClick={onExtractClick}
                    >
                      {icon}
                    </button>
                  );
                }

                if (entry.id === 'garage') {
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      aria-label={entry.text}
                      title={entry.text}
                      aria-pressed={garagePanelOpen}
                      style={
                        garagePanelOpen
                          ? { ...capabilityIconButtonStyle, ...actionButtonActiveStyle }
                          : capabilityIconButtonStyle
                      }
                      onClick={onGarageClick}
                      onMouseEnter={() => onGarageHoverChange?.(true)}
                      onMouseLeave={() => onGarageHoverChange?.(false)}
                      onFocus={() => onGarageHoverChange?.(true)}
                      onBlur={() => onGarageHoverChange?.(false)}
                    >
                      {icon}
                    </button>
                  );
                }

                return (
                  <span
                    key={entry.id}
                    title={entry.text}
                    aria-label={entry.text}
                    style={capabilityIconDisplayStyle}
                  >
                    {icon}
                  </span>
                );
              })}
              {showMoveTo ? (
                <button
                  type="button"
                  aria-label="Move"
                  title="Move"
                  aria-pressed={moveModeActive}
                  disabled={moveDisabled}
                  style={
                    moveModeActive
                      ? { ...moveIconButtonStyle, ...actionButtonActiveStyle }
                      : moveDisabled
                        ? { ...moveIconButtonStyle, ...actionButtonDisabledStyle }
                        : moveIconButtonStyle
                  }
                  onClick={onMoveClick}
                >
                  <img src={moveIcon} alt="" aria-hidden style={capabilityIconImageStyle} />
                </button>
              ) : null}
            </li>
          ) : null}
          {parkTargets.map((target) => (
            <li key={target.garageUnitId} style={parkActionRowStyle}>
              <button
                type="button"
                disabled={parkDisabled || pendingParkGarageId === target.garageUnitId}
                style={
                  parkDisabled || pendingParkGarageId === target.garageUnitId
                    ? { ...actionButtonStyle, ...actionButtonDisabledStyle }
                    : actionButtonStyle
                }
                onClick={() => onParkClick?.(target.garageUnitId)}
              >
                Park in {target.garageName}
              </button>
            </li>
          ))}
          {textCapabilityEntries.map((entry) => (
            <li key={entry.id} style={itemStyle}>
              {entry.text}
            </li>
          ))}
        </ul>
      )}
      {moveError != null ? (
        <p style={moveErrorStyle} role="alert">
          {moveError}
        </p>
      ) : null}
    </aside>
  );
}
