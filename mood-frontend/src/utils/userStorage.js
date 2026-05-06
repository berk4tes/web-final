const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const mergeArraysByIdentity = (primary, legacy) => {
  const seen = new Set();
  return [...primary, ...legacy].filter((item) => {
    const key = typeof item === 'object' && item
      ? item.externalId || item._id || item.id || item.title || JSON.stringify(item)
      : String(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getUserScopedKey = (baseKey, userId) => (
  userId ? `${baseKey}:${userId}` : `${baseKey}:guest`
);

export const readUserScopedJson = (baseKey, userId, fallback) => {
  if (typeof localStorage === 'undefined') return fallback;
  const scopedKey = getUserScopedKey(baseKey, userId);
  const scopedRaw = localStorage.getItem(scopedKey);
  const legacyRaw = localStorage.getItem(baseKey);
  if (scopedRaw !== null) {
    const scopedValue = safeParse(scopedRaw, fallback);
    if (legacyRaw !== null && Array.isArray(scopedValue)) {
      const legacyValue = safeParse(legacyRaw, []);
      if (Array.isArray(legacyValue) && legacyValue.length) {
        const merged = mergeArraysByIdentity(scopedValue, legacyValue);
        if (merged.length !== scopedValue.length) localStorage.setItem(scopedKey, JSON.stringify(merged));
        return merged;
      }
    }
    return scopedValue;
  }

  if (legacyRaw === null) return fallback;
  const legacyValue = safeParse(legacyRaw, fallback);
  localStorage.setItem(scopedKey, JSON.stringify(legacyValue));
  return legacyValue;
};

export const writeUserScopedJson = (baseKey, userId, value) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(getUserScopedKey(baseKey, userId), JSON.stringify(value));
};

export const removeUserScopedValue = (baseKey, userId) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(getUserScopedKey(baseKey, userId));
};
