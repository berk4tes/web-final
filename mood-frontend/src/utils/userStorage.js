const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const getUserScopedKey = (baseKey, userId) => (
  userId ? `${baseKey}:${userId}` : `${baseKey}:guest`
);

export const readUserScopedJson = (baseKey, userId, fallback) => {
  if (typeof localStorage === 'undefined') return fallback;
  return safeParse(localStorage.getItem(getUserScopedKey(baseKey, userId)), fallback);
};

export const writeUserScopedJson = (baseKey, userId, value) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(getUserScopedKey(baseKey, userId), JSON.stringify(value));
};

export const removeUserScopedValue = (baseKey, userId) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(getUserScopedKey(baseKey, userId));
};
