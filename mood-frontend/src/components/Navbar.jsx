import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import { useAuth } from '../context/AuthContext';
import { useMoodTheme } from '../context/MoodThemeContext';
import { useUserPreferences } from '../context/UserPreferencesContext';

const LogoMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" />
  </svg>
);

const NAV_ITEMS = [
  { to: '/vibe', key: 'navVibe' },
  { to: '/dashboard', key: 'navDashboard' },
  { to: '/motivation', key: 'navMotivation' },
  { to: '/moodboard', key: 'navMoodboard' },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, resetVibe, vibeData } = useMoodTheme();
  const { prefs, t } = useUserPreferences();
  const tr = prefs.language === 'tr';
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    resetVibe();
    setOpen(false);
    navigate('/login');
  };

  return (
    <header className="navbar-root sticky top-0 z-40">
      <div className="mx-auto flex h-[4.8rem] max-w-[92rem] items-center justify-between gap-5 px-6 md:px-8">

        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span
            className="nav-brand-mark shrink-0 text-white"
            style={{
              background: theme
                ? `linear-gradient(145deg, ${theme.accent}, ${theme.ink})`
                : 'linear-gradient(145deg, #7c5cff, #e87a4d)',
            }}
          >
            <LogoMark />
          </span>
          <span className="text-[1rem] font-semibold tracking-tight text-ink-700">Luma</span>
          {vibeData?.mood?.title && (
            <span className="hidden max-w-[15rem] truncate text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-ink-400 xl:block">
              {vibeData.mood.title}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        {isAuthenticated && (
          <nav className="nav-pill-shell hidden flex-1 items-center justify-center gap-1.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? 'nav-item-active'
                    : 'nav-item'
                }
              >
                {item.label || t(item.key)}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="nav-actions-shell hidden shrink-0 items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="nav-avatar-btn"
                aria-label={t('navProfile')}
                title={t('navProfile')}
              >
                <UserAvatar value={user?.avatar} name={user?.username} className="h-full w-full text-[0.65rem]" />
              </Link>
              <button onClick={handleLogout} className="nav-util-btn">
                {t('signOut')}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-util-btn">{t('signIn')}</NavLink>
              <Link to="/register" className="nav-cta-btn">{t('getStarted')}</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label={tr ? 'Menüyü aç/kapat' : 'Toggle menu'}
          className="nav-hamburger md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open
              ? <path d="M6 6l12 12M6 18L18 6" />
              : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="nav-mobile-drawer md:hidden">
          <div className="mx-auto max-w-[92rem] space-y-1 px-4 py-3">
            {isAuthenticated ? (
              <>
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      isActive ? 'nav-mobile-item-active' : 'nav-mobile-item'
                    }
                  >
                    {item.label || t(item.key)}
                  </NavLink>
                ))}
                <button onClick={handleLogout} className="nav-mobile-item w-full text-left">
                  {t('signOut')}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setOpen(false)} className="nav-mobile-item">
                  {t('signIn')}
                </NavLink>
                <NavLink to="/register" onClick={() => setOpen(false)} className="nav-mobile-item-active">
                  {t('getStarted')}
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
