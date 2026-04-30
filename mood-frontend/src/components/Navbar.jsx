import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import { useAuth } from '../context/AuthContext';
import { useMoodTheme } from '../context/MoodThemeContext';
import { useUserPreferences } from '../context/UserPreferencesContext';

const LogoMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill="currentColor" stroke="none" />
  </svg>
);

const NAV_ITEMS = [
  { to: '/vibe', key: 'navVibe' },
  { to: '/dashboard', key: 'navDashboard' },
  { to: '/motivation', key: 'navMotivation' },
  { to: '/moodboard', label: 'Moodboard' },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, resetVibe, vibeData } = useMoodTheme();
  const { t } = useUserPreferences();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    resetVibe();
    setOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <nav className="nav-shell mx-auto flex max-w-[82rem] items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <Link to="/" className="nav-brand flex min-w-0 items-center gap-3 text-base font-semibold text-ink-700">
          <span
            className="nav-brand-mark grid place-items-center text-white transition-colors duration-500"
            style={{
              background: theme
                ? `linear-gradient(145deg, ${theme.accent}, ${theme.ink})`
                : 'linear-gradient(145deg, #7c5cff, #e87a4d)',
            }}
          >
            <LogoMark />
          </span>
          <span className="nav-brand-copy min-w-0">
            <span className="nav-brand-word block truncate font-display text-xl tracking-tight">Luma</span>
            <span className="nav-brand-mood block text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">
              {vibeData?.mood?.title || 'Melancholic reflections'}
            </span>
          </span>
        </Link>

        {isAuthenticated && (
          <div className="nav-rail hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                {item.label || t(item.key)}
              </NavLink>
            ))}
          </div>
        )}

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="nav-profile-chip"
                aria-label={t('navProfile')}
                title={t('navProfile')}
              >
                <UserAvatar value={user?.avatar} name={user?.username} className="h-7 w-7 text-xs" />
              </Link>
              <button onClick={handleLogout} className="nav-utility">{t('signOut')}</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-utility">{t('signIn')}</NavLink>
              <Link to="/register" className="nav-cta">{t('getStarted')}</Link>
            </>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          className="nav-mobile-toggle grid h-11 w-11 place-items-center md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="nav-mobile-panel mx-auto mt-3 max-w-[82rem] px-4 py-4 md:hidden">
          {isAuthenticated ? (
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `nav-mobile-link ${isActive ? 'is-active' : ''}`}
                >
                  {item.label || t(item.key)}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="nav-mobile-link text-left"
              >
                {t('signOut')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <NavLink to="/login" onClick={() => setOpen(false)} className="nav-mobile-link">{t('signIn')}</NavLink>
              <NavLink to="/register" onClick={() => setOpen(false)} className="nav-mobile-link is-active">{t('getStarted')}</NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
