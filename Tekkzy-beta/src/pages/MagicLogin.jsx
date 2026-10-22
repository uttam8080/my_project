import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const MagicLogin = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'redirecting' | 'error'

  useEffect(() => {
    const email = searchParams.get('email');
    const password = searchParams.get('password');

    if (!email || !password) {
      setStatus('error');
      return;
    }

    setStatus('redirecting');

    // Build the deep link
    const deepLink = `tekkzy://login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

    // Redirect to the app after a short delay (let the page render first)
    const timer = setTimeout(() => {
      window.location.href = deepLink;
    }, 800);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div style={styles.body}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>Tekkzy</div>
        <div style={styles.tagline}>Smart Business Management</div>

        {status === 'error' ? (
          <>
            <div style={styles.iconError}>✕</div>
            <h2 style={styles.heading}>Invalid Link</h2>
            <p style={styles.para}>
              This magic link is invalid or has expired. Please request a new one from the app.
            </p>
          </>
        ) : (
          <>
            {/* Spinner */}
            <div style={styles.spinnerWrap}>
              <div style={styles.spinner} />
            </div>
            <h2 style={styles.heading}>Opening Tekkzy App...</h2>
            <p style={styles.para}>
              The app should open automatically in a moment. If it doesn't, tap the button below.
            </p>
            <a
              href={`tekkzy://login?email=${encodeURIComponent(searchParams.get('email') || '')}&password=${encodeURIComponent(searchParams.get('password') || '')}`}
              style={styles.btn}
            >
              Open Tekkzy App
            </a>
            <p style={styles.note}>
              Make sure the Tekkzy app is installed on your phone.
            </p>
          </>
        )}
      </div>

      {/* Spinner keyframe via a style tag */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  body: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '24px',
    padding: '48px 36px',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
  },
  logo: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#1e40af',
    marginBottom: '6px',
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '40px',
  },
  spinnerWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '28px',
  },
  spinner: {
    width: '56px',
    height: '56px',
    border: '5px solid #e2e8f0',
    borderTopColor: '#1e40af',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
  iconError: {
    width: '56px',
    height: '56px',
    background: '#fee2e2',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#dc2626',
    margin: '0 auto 28px',
    lineHeight: '56px',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: '12px',
  },
  para: {
    fontSize: '15px',
    color: '#64748b',
    lineHeight: '1.7',
    marginBottom: '28px',
  },
  btn: {
    display: 'inline-block',
    background: '#1e40af',
    color: '#fff',
    textDecoration: 'none',
    padding: '18px 44px',
    borderRadius: '14px',
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '0.3px',
    boxShadow: '0 8px 24px rgba(30,64,175,0.35)',
  },
  note: {
    fontSize: '12px',
    color: '#cbd5e1',
    marginTop: '20px',
  },
};

export default MagicLogin;
