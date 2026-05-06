import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { translate } from '../utils/i18n';
import { readUserScopedJson, writeUserScopedJson } from '../utils/userStorage';

export const PREFS_KEY = 'luma.preferences';

export const REC_PREFS_DEFAULTS = {
  showMovies: true,
  showSeries: true,
  showBooks: true,
  showMusic: true,
  showPopular: true,
  showNiche: true,
  highMatchOnly: false,
};

const DEFAULT_PREFS = {
  fullName: '',
  language: 'en',
  appearance: 'light',
  recPrefs: REC_PREFS_DEFAULTS,
};

const getSystemAppearance = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return DEFAULT_PREFS.appearance;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const normalizePrefs = (stored = {}) => ({
  ...DEFAULT_PREFS,
  ...stored,
  appearance: stored.appearance === 'dark' || stored.appearance === 'light'
    ? stored.appearance
    : getSystemAppearance(),
  recPrefs: { ...REC_PREFS_DEFAULTS, ...(stored.recPrefs || {}) },
});

const readPrefs = (userId) => (
  userId ? normalizePrefs(readUserScopedJson(PREFS_KEY, userId, {})) : normalizePrefs({})
);

const UserPreferencesContext = createContext(null);

export const UserPreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id;
  const [prefs, setPrefs] = useState(() => readPrefs(userId));

  useEffect(() => {
    setPrefs(readPrefs(userId));
  }, [userId]);

  const savePrefs = (next) => {
    const normalized = normalizePrefs(next);
    setPrefs(normalized);
    writeUserScopedJson(PREFS_KEY, userId, normalized);
  };

  useEffect(() => {
    document.documentElement.lang = prefs.language === 'tr' ? 'tr' : 'en';
  }, [prefs.language]);

  const value = useMemo(
    () => ({
      prefs,
      savePrefs,
      t: (key) => translate(prefs.language, key),
    }),
    [prefs]
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error('useUserPreferences must be used inside UserPreferencesProvider');
  return ctx;
};
