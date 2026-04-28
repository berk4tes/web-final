import { createContext, useContext, useState } from 'react';
import { getVibeColor } from '../utils/constants';

const CURRENT_VIBE_KEY = 'moodflix.currentVibe';

const MoodThemeContext = createContext(null);

const loadDefaultColorKey = () => {
  try {
    const prefs = JSON.parse(localStorage.getItem('moodflix.preferences') || '{}');
    return prefs.defaultTheme || null;
  } catch {
    return null;
  }
};

export const MoodThemeProvider = ({ children }) => {
  const [vibeData, setVibeDataRaw] = useState(() => {
    try {
      const s = localStorage.getItem(CURRENT_VIBE_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const colorKey = vibeData?.mood?.colorKey || loadDefaultColorKey();
  const theme = colorKey ? getVibeColor(colorKey) : null;

  const setVibe = (data) => {
    setVibeDataRaw(data);
    if (data) {
      localStorage.setItem(CURRENT_VIBE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(CURRENT_VIBE_KEY);
    }
  };

  const resetVibe = () => setVibe(null);

  return (
    <MoodThemeContext.Provider value={{ vibeData, colorKey, theme, setVibe, resetVibe }}>
      {children}
    </MoodThemeContext.Provider>
  );
};

export const useMoodTheme = () => {
  const ctx = useContext(MoodThemeContext);
  if (!ctx) throw new Error('useMoodTheme must be used inside MoodThemeProvider');
  return ctx;
};
