import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    try {
      const [t, u] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('user'),
      ]);
      if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    } finally { setLoading(false); }
  })(); }, []);

  const persist = async (newToken, userData) => {
    await AsyncStorage.setItem('authToken', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await authAPI.login(email, password); // axios returns body
      if (res.status === 'success') {
        const { token: newToken, user: userData } = res;
        await persist(newToken, userData);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Login failed' };
    } finally { setLoading(false); }
  };

  const register = async (data) => {
    try {
      setLoading(true);
      const res = await authAPI.register(data);
      if (res.status === 'success') {
        const { token: newToken, user: userData } = res;
        await persist(newToken, userData);
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Registration failed' };
    } finally { setLoading(false); }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      setLoading(true);
      const res = await authAPI.google(idToken);
      if (res.status === 'success') {
        const { token: newToken, user: userData } = res;
        await persist(newToken, userData);
        return { success: true };
      }
      return { success: false, message: res.message || 'Google sign-in failed' };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Google sign-in failed' };
    } finally { setLoading(false); }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['authToken', 'user']);
    setToken(null); setUser(null);
  };

  const updateUser = async (patch) => {
    const updated = { ...user, ...patch };
    await AsyncStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, loginWithGoogle,
      logout, updateUser,
      isAuthenticated: !!token && !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
