export const CURRENT_VIBE_KEY = 'moodflix.currentVibe';
export const VIBE_LISTS_KEY = 'moodflix.currentVibeLists';

const VIBE_SESSION_KEYS = [CURRENT_VIBE_KEY, VIBE_LISTS_KEY];

const removeStoredValue = (storage, key) => {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage can be unavailable in strict privacy contexts.
  }
};

const clearLegacyLocalValue = (key) => {
  if (typeof localStorage === 'undefined') return;
  removeStoredValue(localStorage, key);
};

export const readVibeSession = () => {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const stored = sessionStorage.getItem(CURRENT_VIBE_KEY);
    clearLegacyLocalValue(CURRENT_VIBE_KEY);
    clearLegacyLocalValue(VIBE_LISTS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const writeVibeSession = (data) => {
  if (!data) {
    clearVibeSession();
    return;
  }
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(CURRENT_VIBE_KEY, JSON.stringify(data));
    }
  } catch {
    // Keep the in-memory React state as the source of truth for this render.
  }
};

export const readVibeListsSession = () => {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const stored = sessionStorage.getItem(VIBE_LISTS_KEY);
    clearLegacyLocalValue(VIBE_LISTS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const writeVibeListsSession = (data) => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(VIBE_LISTS_KEY, JSON.stringify(data));
    }
  } catch {
    // Recommendation rendering should never depend on storage availability.
  }
};

export const clearVibeSession = () => {
  VIBE_SESSION_KEYS.forEach((key) => {
    if (typeof sessionStorage !== 'undefined') removeStoredValue(sessionStorage, key);
    clearLegacyLocalValue(key);
  });
};
