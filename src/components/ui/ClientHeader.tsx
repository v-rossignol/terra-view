import { Link } from 'react-router-dom';

interface ClientHeaderProps {
  playerName?: string | null;
  starName?: string | null;
  starSystemHref?: string | null;
  planetName?: string | null;
  planetTo?: string;
  detail?: string | null;
  status?: 'loading' | 'ready' | 'error';
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  minHeight: '3rem',
  padding: '0 1.25rem',
  borderBottom: '1px solid #2a2a2a',
  backgroundColor: '#141414',
  color: '#f0f0f0',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '0.9375rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const labelStyle: React.CSSProperties = {
  color: '#9a9a9a',
  marginRight: '0.35rem',
};

const separatorStyle: React.CSSProperties = {
  color: '#5a5a5a',
  margin: '0 0.75rem',
};

const linkStyle: React.CSSProperties = {
  color: '#7eb8ff',
  textDecoration: 'none',
};

const headerMainStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const reloadButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  marginLeft: 'auto',
  padding: 0,
  borderRadius: '4px',
  border: '1px solid #3a3a3a',
  backgroundColor: 'transparent',
  color: '#9a9a9a',
  cursor: 'pointer',
  flexShrink: 0,
};

function handleReloadClick(): void {
  window.location.reload();
}

export function ClientHeader({
  playerName,
  starName,
  starSystemHref,
  planetName,
  planetTo,
  detail,
  status = 'ready',
}: ClientHeaderProps) {
  const showContext = status === 'ready' && playerName && planetName;

  return (
    <header style={headerStyle}>
      <div style={headerMainStyle}>
        <span style={{ fontWeight: 600, marginRight: '1rem' }}>Terra View</span>
        {showContext ? (
          <span>
            <span>
              <span style={labelStyle}>Player</span>
              {playerName}
            </span>
            {starName ? (
              <>
                <span style={separatorStyle} aria-hidden="true">
                  ·
                </span>
                <span>
                  <span style={labelStyle}>Star</span>
                  {starSystemHref ? (
                    <a href={starSystemHref} style={linkStyle}>
                      {starName}
                    </a>
                  ) : (
                    starName
                  )}
                </span>
              </>
            ) : null}
            <span style={separatorStyle} aria-hidden="true">
              ·
            </span>
            <span>
              <span style={labelStyle}>Planet</span>
              {planetTo != null ? (
                <Link to={planetTo} style={linkStyle}>
                  {planetName}
                </Link>
              ) : (
                planetName
              )}
            </span>
            {detail ? (
              <>
                <span style={separatorStyle} aria-hidden="true">
                  ·
                </span>
                <span>{detail}</span>
              </>
            ) : null}
          </span>
        ) : status === 'loading' ? (
          <span style={{ color: '#9a9a9a' }}>Loading…</span>
        ) : null}
      </div>
      <button
        type="button"
        style={reloadButtonStyle}
        onClick={handleReloadClick}
        aria-label="Reload page"
        title="Reload page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
      </button>
    </header>
  );
}
