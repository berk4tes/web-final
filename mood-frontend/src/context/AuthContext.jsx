// AuthContext — token + user state, login/logout actions, bootstrapped from localStorage
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { clearVibeSession } from '../utils/vibeSession';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      clearVibeSession();
    }
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      if (token) {
        await fetchMe();
      }
      if (active) setIsLoading(false);
    };
    bootstrap();
    return () => {
      active = false;
    };
  }, [token, fetchMe]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('token', data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    clearVibeSession();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((next) => {
    setUser((prev) => ({ ...prev, ...next }));
  }, []);

  const value = {
    token,
    user,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
