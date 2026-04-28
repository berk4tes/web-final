import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMoodTheme } from '../context/MoodThemeContext';

const LogoMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill="currentColor" stroke="none" />
  </svg>
);

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, resetVibe, vibeData } = useMoodTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    resetVibe();
    setOpen(false);
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-ink-700 text-white'
        : 'text-ink-500 hover:bg-ink-100 hover:text-ink-700'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-ink-50/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-base font-semibold text-ink-700">
          <span
            className="grid h-9 w-9 place-items-center rounded-2xl text-white shadow-glow transition-colors duration-500"
            style={{
              background: theme
                ? `linear-gradient(135deg, ${theme.accent}, ${theme.ink})`
                : 'linear-gradient(135deg, #7c5cff, #e87a4d)',
            }}
          >
            <LogoMark />
          </span>
          <span className="font-display text-xl tracking-tight">MoodFlix</span>
        </Link>

        {isAuthenticated && (
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/vibe" className={linkClass}>Vibe</NavLink>
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
            <NavLink to="/profile" className={linkClass}>Profile</NavLink>
          </div>
        )}

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              {vibeData && (
                <button
                  onClick={() => { resetVibe(); navigate('/vibe'); }}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-400 transition hover:text-rose-500 border border-ink-200 hover:border-rose-200"
                >
                  Reset vibe
                </button>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-600 transition hover:bg-ink-50"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white transition-colors duration-500"
                    style={{
                      background: theme
                        ? `linear-gradient(135deg, ${theme.accent}, ${theme.ink})`
                        : 'linear-gradient(135deg, #7c5cff, #e87a4d)',
                    }}
                  >
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
                <span className="max-w-[120px] truncate">{user?.username}</span>
              </Link>
              <button onClick={handleLogout} className="btn-ghost">Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Sign in</NavLink>
              <Link to="/register" className="btn-primary text-sm">Get started</Link>
            </>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          className="grid h-10 w-10 place-items-center rounded-full border border-ink-200 text-ink-600 transition hover:bg-ink-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 py-3 md:hidden">
          {isAuthenticated ? (
            <div className="flex flex-col gap-1">
              <NavLink to="/vibe" onClick={() => setOpen(false)} className={linkClass}>Vibe</NavLink>
              <NavLink to="/dashboard" onClick={() => setOpen(false)} className={linkClass}>Dashboard</NavLink>
              <NavLink to="/profile" onClick={() => setOpen(false)} className={linkClass}>Profile</NavLink>
              {vibeData && (
                <button
                  onClick={() => { resetVibe(); setOpen(false); navigate('/vibe'); }}
                  className="mt-1 rounded-full px-4 py-2 text-left text-sm text-rose-500 hover:bg-rose-50"
                >
                  Reset vibe
                </button>
              )}
              <button
                onClick={handleLogout}
                className="mt-1 rounded-full px-4 py-2 text-left text-sm text-ink-500 hover:bg-ink-100"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <NavLink to="/login" onClick={() => setOpen(false)} className={linkClass}>Sign in</NavLink>
              <NavLink to="/register" onClick={() => setOpen(false)} className={linkClass}>Get started</NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
