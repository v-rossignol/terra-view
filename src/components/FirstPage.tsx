import { useFirstPageBootstrap } from '../hooks/useFirstPageBootstrap';
import { ClientHeader } from './ui/ClientHeader';

const layoutStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
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
  padding: '2rem',
  gap: '1rem',
};

const errorStyle: React.CSSProperties = {
  color: '#ff6b6b',
  maxWidth: '32rem',
  textAlign: 'center',
};

export function FirstPage() {
  const { status, playerName, planetName, error } = useFirstPageBootstrap();

  return (
    <div style={layoutStyle}>
      <ClientHeader playerName={playerName} planetName={planetName} status={status} />
      <main style={contentStyle}>
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
      </main>
    </div>
  );
}
