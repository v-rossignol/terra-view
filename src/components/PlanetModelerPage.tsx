import { HexGrid } from './game/HexGrid';
import { usePlanetModeler } from '../hooks/usePlanetModeler';
import type { PlanetType } from '../types/admin';

const LOGIN_PATH = '/stellar-gate/';

const layoutStyle: React.CSSProperties = {
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#0f0f0f',
  color: '#f0f0f0',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.75rem 1rem',
  padding: '0.75rem 1.25rem',
  borderBottom: '1px solid #2a2a2a',
  backgroundColor: '#141414',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontSize: '0.875rem',
  color: '#d0d0d0',
};

const inputStyle: React.CSSProperties = {
  padding: '0.35rem 0.5rem',
  borderRadius: '4px',
  border: '1px solid #3a3a3a',
  backgroundColor: '#1a1a1a',
  color: '#f0f0f0',
  fontSize: '0.875rem',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  borderRadius: '4px',
  border: '1px solid #3a3a3a',
  backgroundColor: '#2a2a2a',
  color: '#f0f0f0',
  fontSize: '0.875rem',
  cursor: 'pointer',
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#3d5a80',
  borderColor: '#4a6fa5',
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

const linkStyle: React.CSSProperties = {
  color: '#7eb8ff',
  textDecoration: 'none',
};

const metaStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#9a9a9a',
};

const PLANET_TYPES: PlanetType[] = ['rocky', 'ice', 'lava'];

export function PlanetModelerPage() {
  const {
    status,
    radius,
    type,
    seed,
    preview,
    error,
    setRadius,
    setType,
    setSeed,
    randomizeSeed,
    generate,
  } = usePlanetModeler();

  const isGenerating = status === 'loading';

  return (
    <div style={layoutStyle}>
      <header style={toolbarStyle}>
        <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>Planet Modeler</span>

        <label style={labelStyle}>
          Radius
          <select
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            style={inputStyle}
            disabled={isGenerating}
          >
            {Array.from({ length: 11 }, (_, index) => index + 5).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as PlanetType)}
            style={inputStyle}
            disabled={isGenerating}
          >
            {PLANET_TYPES.map((planetType) => (
              <option key={planetType} value={planetType}>
                {planetType}
              </option>
            ))}
          </select>
        </label>

        <label style={{ ...labelStyle, flex: '1 1 12rem', minWidth: '12rem' }}>
          Seed
          <input
            type="text"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            placeholder="Random if empty"
            style={{ ...inputStyle, flex: 1, minWidth: '10rem' }}
            disabled={isGenerating}
          />
        </label>

        <button type="button" style={buttonStyle} onClick={randomizeSeed} disabled={isGenerating}>
          Random seed
        </button>

        <button type="button" style={primaryButtonStyle} onClick={() => void generate()} disabled={isGenerating}>
          {isGenerating ? 'Generating…' : 'Generate'}
        </button>

        {preview != null && status === 'ready' ? (
          <span style={metaStyle}>
            Preview seed: <code>{preview._id}</code>
          </span>
        ) : null}
      </header>

      <main style={status === 'ready' && preview != null ? contentStyle : centeredContentStyle}>
        {status === 'unauthorized' && error != null && (
          <>
            <p style={errorStyle} role="alert">
              {error}
            </p>
            <a href={LOGIN_PATH} style={linkStyle}>
              Go to Stellar Gate
            </a>
          </>
        )}

        {status === 'error' && error != null && (
          <p style={errorStyle} role="alert">
            {error}
          </p>
        )}

        {status === 'idle' && (
          <p style={{ color: '#9a9a9a' }}>Set parameters and click Generate to preview a planet surface.</p>
        )}

        {status === 'loading' && <p style={{ color: '#9a9a9a' }}>Generating planet surface…</p>}

        {status === 'ready' && preview != null && (
          <HexGrid radius={preview.radius} hexagons={preview.surface.hexagons} />
        )}
      </main>
    </div>
  );
}
