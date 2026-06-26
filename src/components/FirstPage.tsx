import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirstPageBootstrap } from '../hooks/useFirstPageBootstrap';
import type { HexCoords } from '../types/planet';
import { HexGrid } from './game/HexGrid';
import { ClientHeader } from './ui/ClientHeader';

const layoutStyle: React.CSSProperties = {
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#0f0f0f',
  color: '#f0f0f0',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  minHeight: 0,
  width: '100%',
  overflow: 'hidden',
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

export function FirstPage() {
  const navigate = useNavigate();
  const { status, playerName, playerId, starName, starSystemHref, planetName, planet, planetUnits, error } =
    useFirstPageBootstrap();

  const handleHexClick = useCallback(
    (coords: HexCoords) => {
      if (planet == null) {
        return;
      }

      navigate(`/${planet._id}/${coords.q}/${coords.r}`);
    },
    [navigate, planet],
  );

  return (
    <div style={layoutStyle}>
      <ClientHeader
        playerName={playerName}
        starName={starName}
        starSystemHref={starSystemHref}
        planetName={planetName}
        status={status}
      />
      <main style={status === 'ready' ? contentStyle : centeredContentStyle}>
        {status === 'loading' && <p style={{ color: '#9a9a9a' }}>Connecting…</p>}

        {status === 'error' && (
          <>
            <p style={errorStyle} role="alert">
              {error}
            </p>
            <p>
              <a href="/stellar-gate/" style={{ color: '#7eb8ff' }}>
                Go to Stellar Gate
              </a>
            </p>
          </>
        )}

        {status === 'ready' && planet != null && (
          <HexGrid
            radius={planet.radius}
            hexagons={planet.surface?.hexagons}
            playerId={playerId ?? undefined}
            planetUnits={planetUnits}
            onHexClick={handleHexClick}
          />
        )}
      </main>
    </div>
  );
}
