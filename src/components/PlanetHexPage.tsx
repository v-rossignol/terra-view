import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { usePlanetHex } from '../hooks/usePlanetHex';
import type { HexCoords } from '../types/planet';
import { formatHexCoords } from '../utils/hexCoords';
import { SingleHexView } from './game/SingleHexView';
import { HexResourcesPanel } from './ui/HexResourcesPanel';

const layoutStyle: React.CSSProperties = {
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#0f0f0f',
  color: '#f0f0f0',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  minHeight: '3rem',
  padding: '0 1.25rem',
  borderBottom: '1px solid #2a2a2a',
  backgroundColor: '#141414',
  fontSize: '0.9375rem',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  minHeight: 0,
  width: '100%',
  overflow: 'hidden',
  position: 'relative',
};

const centeredContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  padding: '1rem',
  overflow: 'auto',
};

const errorStyle: React.CSSProperties = {
  color: '#ff6b6b',
  maxWidth: '32rem',
  textAlign: 'center',
};

const linkStyle: React.CSSProperties = {
  color: '#7eb8ff',
  textDecoration: 'none',
};

const metaStyle: React.CSSProperties = {
  position: 'absolute',
  left: '1rem',
  bottom: '1rem',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  border: '1px solid #3a3a3a',
  backgroundColor: 'rgba(20, 20, 20, 0.95)',
  fontSize: '0.8125rem',
  lineHeight: 1.45,
  zIndex: 10,
};

export function PlanetHexPage() {
  const navigate = useNavigate();
  const { planetId, q, r } = useParams();
  const { status, planetName, coords, hex, neighbors, hexResources, error, planetRadius } =
    usePlanetHex(planetId, q, r);

  const handleNeighborClick = useCallback(
    (neighborCoords: HexCoords) => {
      if (planetId == null) {
        return;
      }

      navigate(`/${planetId}/${neighborCoords.q}/${neighborCoords.r}`);
    },
    [navigate, planetId],
  );

  const title =
    planetName != null && coords != null
      ? `${planetName} · Hex ${formatHexCoords(coords)}`
      : coords != null
        ? `Hex ${formatHexCoords(coords)}`
        : 'Planet hex';

  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <Link to="/" style={linkStyle}>
          Terra View
        </Link>
        <span style={{ color: '#5a5a5a' }}>/</span>
        <span>{title}</span>
      </header>

      <main style={status === 'ready' && hex != null ? contentStyle : centeredContentStyle}>
        {status === 'loading' && <p style={{ color: '#9a9a9a' }}>Loading hex…</p>}

        {status === 'error' && error != null && (
          <>
            <p style={errorStyle} role="alert">
              {error}
            </p>
            <Link to="/" style={linkStyle}>
              Back to planet surface
            </Link>
          </>
        )}

        {status === 'ready' && hex != null && coords != null && planetRadius != null && (
          <>
            <SingleHexView
              hex={hex}
              radius={planetRadius}
              neighbors={neighbors}
              onNeighborClick={handleNeighborClick}
            />
            <aside style={metaStyle}>
              <p style={{ margin: '0 0 0.35rem', fontWeight: 600 }}>{hex.biome}</p>
              <p style={{ margin: 0, color: '#b0b0b0' }}>Danger level: {hex.dangerLevel}</p>
            </aside>
            <HexResourcesPanel
              hoveredHex={coords}
              hexResources={hexResources}
              status={hexResources != null ? 'ready' : 'error'}
              error={hexResources == null ? 'Failed to load hex resources.' : null}
            />
          </>
        )}
      </main>
    </div>
  );
}
