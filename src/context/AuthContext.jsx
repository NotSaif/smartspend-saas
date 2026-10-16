import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getToken, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // Restore the session from a stored token
  useEffect(() => {
    if (!getToken()) return;
    authAPI.me()
      .then(res => setCurrentUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const startSession = (res) => {
    setToken(res.token);
    setCurrentUser(res.user);
    return { success: true };
  };

  const login = async (email, password) => {
    try {
      return startSession(await authAPI.login(email, password));
    } catch (err) {
      return { success: false, error: err.message || 'Invalid email or password.' };
    }
  };

  const register = async (payload) => {
    try {
      return startSession(await authAPI.register(payload));
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
  };

  const updateCurrentUser = (updated) => setCurrentUser(prev => ({ ...prev, ...updated }));

  const role = currentUser?.role;
  const value = {
    currentUser, loading, login, register, logout, updateCurrentUser,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    canEdit: role === 'owner' || role === 'admin', // create / edit / delete financial data
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
