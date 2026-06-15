import { Link, useParams } from 'react-router-dom';
import { usePlanetRelocate } from '../hooks/usePlanetRelocate';

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
};

export function PlanetRelocatePage() {
  const { planetId } = useParams();
  const { status, error } = usePlanetRelocate(planetId);

  return (
    <div style={layoutStyle}>
      <main style={contentStyle}>
        {status === 'loading' && <p style={{ color: '#9a9a9a' }}>Relocating…</p>}

        {status === 'error' && error != null && (
          <>
            <p style={errorStyle} role="alert">
              {error}
            </p>
            {error.includes('/stellar-gate/') && (
              <p>
                <a href="/stellar-gate/" style={linkStyle}>
                  Go to Stellar Gate
                </a>
              </p>
            )}
            <p>
              <Link to="/" style={linkStyle}>
                Back to Terra View
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
