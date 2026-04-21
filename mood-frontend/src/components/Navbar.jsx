// Navbar — top navigation with responsive hamburger menu
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-purple-600/20 text-purple-300'
        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-base">
            🎭
          </span>
          <span className="hidden sm:inline">MoodFlix</span>
        </Link>

        {isAuthenticated && (
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/mood" className={linkClass}>
              Mood
            </NavLink>
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Profil
            </NavLink>
          </div>
        )}

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700/60"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
                <span className="max-w-[120px] truncate">{user?.username}</span>
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm">
                Çıkış
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Giriş
              </NavLink>
              <Link to="/register" className="btn-primary text-sm">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800/60 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-800/60 bg-slate-950/95 px-4 py-3 md:hidden">
          {isAuthenticated ? (
            <div className="flex flex-col gap-1">
              <NavLink to="/mood" onClick={() => setOpen(false)} className={linkClass}>
                Mood
              </NavLink>
              <NavLink to="/dashboard" onClick={() => setOpen(false)} className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/profile" onClick={() => setOpen(false)} className={linkClass}>
                Profil
              </NavLink>
              <button
                onClick={handleLogout}
                className="mt-1 rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/60"
              >
                Çıkış yap
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <NavLink to="/login" onClick={() => setOpen(false)} className={linkClass}>
                Giriş
              </NavLink>
              <NavLink to="/register" onClick={() => setOpen(false)} className={linkClass}>
                Kayıt Ol
              </NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
