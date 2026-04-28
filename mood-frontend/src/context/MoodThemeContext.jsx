import { createContext, useContext, useState } from 'react';
import { getVibeColor } from '../utils/constants';
import { inferMoodKeyFromText } from '../utils/moodKeywords';

const CURRENT_VIBE_KEY = 'moodflix.currentVibe';
const VIBE_LISTS_KEY = 'moodflix.currentVibeLists';

const MoodThemeContext = createContext(null);

export const MoodThemeProvider = ({ children }) => {
  const [vibeData, setVibeDataRaw] = useState(() => {
    try {
      const s = localStorage.getItem(CURRENT_VIBE_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [draftColorKey, setDraftColorKey] = useState(null);

  const colorKey = vibeData?.mood?.colorKey || draftColorKey;
  const theme = colorKey ? getVibeColor(colorKey) : null;

  const setVibe = (data) => {
    setVibeDataRaw(data);
    if (data) setDraftColorKey(null);
    if (data) {
      localStorage.setItem(CURRENT_VIBE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(CURRENT_VIBE_KEY);
      localStorage.removeItem(VIBE_LISTS_KEY);
    }
  };

  const setDraftMoodFromPrompt = (text) => {
    setDraftColorKey(inferMoodKeyFromText(text));
  };

  const resetVibe = () => {
    setDraftColorKey(null);
    setVibe(null);
  };

  return (
    <MoodThemeContext.Provider value={{ vibeData, colorKey, theme, setVibe, resetVibe, setDraftMoodFromPrompt }}>
      {children}
    </MoodThemeContext.Provider>
  );
};

export const useMoodTheme = () => {
  const ctx = useContext(MoodThemeContext);
  if (!ctx) throw new Error('useMoodTheme must be used inside MoodThemeProvider');
  return ctx;
};
