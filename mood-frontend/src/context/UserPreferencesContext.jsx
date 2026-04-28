import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translate } from '../utils/i18n';

export const PREFS_KEY = 'moodflix.preferences';

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

const readPrefs = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return {
      ...DEFAULT_PREFS,
      ...stored,
      recPrefs: { ...REC_PREFS_DEFAULTS, ...(stored.recPrefs || {}) },
    };
  } catch {
    return DEFAULT_PREFS;
  }
};

const UserPreferencesContext = createContext(null);

export const UserPreferencesProvider = ({ children }) => {
  const [prefs, setPrefs] = useState(readPrefs);

  const savePrefs = (next) => {
    const normalized = {
      ...DEFAULT_PREFS,
      ...next,
      recPrefs: { ...REC_PREFS_DEFAULTS, ...(next.recPrefs || {}) },
    };
    setPrefs(normalized);
    localStorage.setItem(PREFS_KEY, JSON.stringify(normalized));
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
