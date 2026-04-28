// NotFoundPage — friendly 404 in light theme
import { Link } from 'react-router-dom';
import { useUserPreferences } from '../context/UserPreferencesContext';

const NotFoundPage = () => {
  const { prefs } = useUserPreferences();
  const tr = prefs.language === 'tr';

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full border border-ink-200 bg-white/80">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-ink-400">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9h.01M15 9h.01M8 16c1.2-1 2.5-1.5 4-1.5s2.8.5 4 1.5" />
        </svg>
      </div>
      <h1 className="mt-6 font-display text-5xl font-semibold text-ink-700">404</h1>
      <p className="mt-2 text-ink-400">{tr ? 'Bu sayfa bulunamadı.' : 'This page lost its vibe.'}</p>
      <Link to="/" className="btn-primary mt-6">
        {tr ? 'Ana sayfaya dön' : 'Back to home'}
      </Link>
    </div>
  );
};

export default NotFoundPage;
