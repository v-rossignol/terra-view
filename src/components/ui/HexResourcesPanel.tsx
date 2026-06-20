import type { HexResourceHoverStatus } from '../../hooks/useHexResourceHover';
import type { HexCoords } from '../../types/planet';
import type { PlanetHexResources } from '../../types/resource';

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  right: '1rem',
  bottom: '1rem',
  width: 'min(18rem, calc(100% - 2rem))',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  border: '1px solid #3a3a3a',
  backgroundColor: 'rgba(20, 20, 20, 0.95)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
  fontSize: '0.8125rem',
  lineHeight: 1.45,
  pointerEvents: 'none',
  zIndex: 10,
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 0.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#f0f0f0',
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

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: '#9a9a9a',
};

const errorStyle: React.CSSProperties = {
  margin: 0,
  color: '#ff8a80',
};

export interface HexResourcesPanelProps {
  hoveredHex: HexCoords | null;
  hexResources: PlanetHexResources | null;
  status: HexResourceHoverStatus;
  error: string | null;
}

function formatCoords(coords: HexCoords): string {
  return `(${coords.q}, ${coords.r})`;
}

export function HexResourcesPanel({
  hoveredHex,
  hexResources,
  status,
  error,
}: HexResourcesPanelProps) {
  if (hoveredHex == null) {
    return null;
  }

  return (
    <aside style={panelStyle} aria-live="polite">
      <p style={titleStyle}>Hex {formatCoords(hoveredHex)}</p>

      {status === 'idle' && <p style={mutedStyle}>Hold cursor to inspect resources…</p>}

      {status === 'loading' && <p style={mutedStyle}>Loading resources…</p>}

      {status === 'error' && error != null && <p style={errorStyle}>{error}</p>}

      {status === 'ready' && hexResources != null && (
        <>
          <p style={metaStyle}>
            Biome: <strong>{hexResources.biome}</strong>
          </p>
          {hexResources.resources.length === 0 ? (
            <p style={mutedStyle}>No resources on this hex.</p>
          ) : (
            <ul style={listStyle}>
              {hexResources.resources.map((resource) => (
                <li key={resource.type} style={itemStyle}>
                  <span>{resource.type}</span>
                  <span>
                    {resource.abundance} · {resource.rarity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  );
}
