import { createContext, useContext, useState, useEffect } from 'react';
import { users, DEMO_CREDENTIALS } from '../data/mockData';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Toggle: set to true once backend is running
const USE_REAL_API = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:5000/api'
  ? true : false;

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('smartspend_token');
      const stored = sessionStorage.getItem('smartspend_user');
      if (token) {
        try {
          const res = await authAPI.me();
          setCurrentUser(res.user);
        } catch {
          localStorage.removeItem('smartspend_token');
        }
      } else if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem('smartspend_token', res.token);
      setCurrentUser(res.user);
      return { success: true };
    } catch (apiErr) {
      return { success: false, error: apiErr.message || 'Invalid email or password.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('smartspend_token');
    sessionStorage.removeItem('smartspend_user');
    setCurrentUser(null);
  };

  const updateCurrentUser = (updated) => {
    setCurrentUser(prev => ({ ...prev, ...updated }));
  };

  const isAdmin  = currentUser?.role === 'admin';
  const isOwner  = currentUser?.role === 'owner';
  const canEdit  = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateCurrentUser, loading, isAdmin, isOwner, canEdit }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
