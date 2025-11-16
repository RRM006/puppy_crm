import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { healthCheck } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('checking');
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await healthCheck();
        if (mounted) setStatus('ok');
      } catch {
        if (mounted) setStatus('error');
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (user?.account_type === 'company') return '/company-dashboard';
    if (user?.account_type === 'customer') return '/customer-dashboard';
    return '/';
  };

	return (
		<>
			<nav className={styles.nav}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            <img src="/logo.svg" alt="CRM" className={styles.logoImg} />
            <span>Puppy CRM </span>
          </Link>

          <div className={styles.links}>
            <a className={styles.link} href="#features">Features</a>
            <a className={styles.link} href="#how-it-works">How It Works</a>
            <a className={styles.link} href="#pricing">Pricing</a>
            {isAuthenticated && user?.account_type === 'company' && (
              <Link className={styles.link} to="/reports">Reports</Link>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={styles.status}>
              <span className={`${styles.statusDot} ${status === 'ok' ? styles.statusOk : status === 'error' ? styles.statusError : styles.statusChecking}`} />
              {status === 'ok' && 'API Connected'}
              {status === 'error' && 'API Offline'}
              {status === 'checking' && 'Checking...'}
            </div>
            <div className={styles.actions}>
              {isAuthenticated ? (
                <>
                  <Link className={styles.btn} to={getDashboardPath()}>
                    Dashboard
                  </Link>
                  <button 
                    className={`${styles.btn} ${styles.primary}`} 
                    onClick={handleLogout}
                    style={{ cursor: 'pointer' }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className={styles.btn} to="/login">Login</Link>
                  <Link className={`${styles.btn} ${styles.primary}`} to="/signup">Sign Up</Link>
                </>
              )}
            </div>
          </div>					<button className={styles.menuBtn} onClick={() => setOpen(!open)} aria-label="Toggle menu">
						☰
					</button>
				</div>
			</nav>

			<div className={styles.spacer} />

			<div className={styles.mobile} style={{ display: open ? 'flex' : 'none' }}>
				<a className={styles.link} href="#features" onClick={() => setOpen(false)}>Features</a>
				<a className={styles.link} href="#how-it-works" onClick={() => setOpen(false)}>How It Works</a>
				<a className={styles.link} href="#pricing" onClick={() => setOpen(false)}>Pricing</a>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {isAuthenticated ? (
            <>
              <Link 
                className={styles.btn} 
                to={getDashboardPath()} 
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              {user?.account_type === 'company' && (
                <Link 
                  className={styles.btn}
                  to="/reports"
                  onClick={() => setOpen(false)}
                >
                  Reports
                </Link>
              )}
              <button 
                className={`${styles.btn} ${styles.primary}`} 
                onClick={handleLogout}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className={styles.btn} to="/login" onClick={() => setOpen(false)}>Login</Link>
              <Link className={`${styles.btn} ${styles.primary}`} to="/signup" onClick={() => setOpen(false)}>Sign Up</Link>
            </>
          )}
				</div>
			</div>
		</>
	);
}