import { createContext, useContext, useState } from 'react';
import { getVibeColor } from '../utils/constants';
import { inferMoodKeyFromText } from '../utils/moodKeywords';
import { clearVibeSession, readVibeSession, writeVibeSession } from '../utils/vibeSession';

const MoodThemeContext = createContext(null);

export const MoodThemeProvider = ({ children }) => {
  const [vibeData, setVibeDataRaw] = useState(readVibeSession);
  const [draftColorKey, setDraftColorKey] = useState(null);

  const colorKey = vibeData?.mood?.colorKey || draftColorKey;
  const theme = colorKey ? getVibeColor(colorKey) : null;

  const setVibe = (data) => {
    setVibeDataRaw(data);
    if (data) setDraftColorKey(null);
    if (data) {
      writeVibeSession(data);
    } else {
      clearVibeSession();
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
