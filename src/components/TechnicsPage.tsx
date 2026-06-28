import { Link, useSearchParams } from 'react-router-dom';
import stellarGateBackground from '../assets/stellar-gate.avif';
import type { TechnicAction } from '../types/technic';
import { resolveTechnic } from '../utils/technics';
import { ClientHeader } from './ui/ClientHeader';

const pageStyle: React.CSSProperties = {
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: 'system-ui, sans-serif',
  color: '#f0f0f0',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  overflow: 'auto',
  backgroundImage: `linear-gradient(rgba(15, 15, 15, 0.72), rgba(15, 15, 15, 0.88)), url(${stellarGateBackground})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

const cardStyle: React.CSSProperties = {
  maxWidth: '28rem',
  width: '100%',
  padding: '2rem',
  borderRadius: '0.5rem',
  backgroundColor: 'rgba(26, 26, 26, 0.92)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  textAlign: 'center',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 1rem',
  fontSize: '1.5rem',
  fontWeight: 600,
};

const messageStyle: React.CSSProperties = {
  margin: '0 0 1.5rem',
  color: '#d0d0d0',
  lineHeight: 1.5,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  alignItems: 'center',
};

const linkStyle: React.CSSProperties = {
  color: '#7eb8ff',
  textDecoration: 'none',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  border: '1px solid #4a6fa5',
  backgroundColor: '#3d5a80',
  color: '#f0f0f0',
  fontSize: '0.9375rem',
  cursor: 'pointer',
};

function handleExternalNavigation(href: string): void {
  window.location.assign(href);
}

function TechnicActionLink({ action }: { action: TechnicAction }) {
  if (action.external && action.presentation === 'button') {
    return (
      <button type="button" style={buttonStyle} onClick={() => handleExternalNavigation(action.href)}>
        {action.label}
      </button>
    );
  }

  if (action.external) {
    return (
      <a href={action.href} style={linkStyle}>
        {action.label}
      </a>
    );
  }

  return (
    <Link to={action.href} style={linkStyle}>
      {action.label}
    </Link>
  );
}

export function TechnicsPage() {
  const [searchParams] = useSearchParams();
  const technic = resolveTechnic(searchParams.get('code'));

  return (
    <div style={pageStyle}>
      <ClientHeader status="error" />
      <main style={contentStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>{technic.title}</h1>
          <p style={messageStyle} role="alert">
            {technic.message}
          </p>
          <nav style={actionsStyle} aria-label="Suggested actions">
            {technic.actions.map((action) => (
              <TechnicActionLink key={`${action.href}-${action.label}`} action={action} />
            ))}
          </nav>
        </div>
      </main>
    </div>
  );
}
