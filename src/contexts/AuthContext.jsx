import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { loginWithEmail, logout as logoutService } from '../services/authService';

const AuthContext = createContext(null);

const DEMO_USER = {
  uid: 'demo-user',
  email: 'demo@fabricio.com',
  displayName: 'Modo Demo',
  isDemo: true,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if demo mode is active
    const isDemoActive = sessionStorage.getItem('demo_mode') === 'true';
    if (isDemoActive) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    let unsubscribe;
    try {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    } catch {
      // Firebase not configured — just show loading done
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  const login = async (email, password) => {
    return await loginWithEmail(email, password);
  };

  const loginDemo = () => {
    sessionStorage.setItem('demo_mode', 'true');
    setUser(DEMO_USER);
  };

  const logout = async () => {
    sessionStorage.removeItem('demo_mode');
    try {
      await logoutService();
    } catch {
      // Ignore if Firebase not configured
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
