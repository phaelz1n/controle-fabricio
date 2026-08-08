import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { loginWithEmail, logout as logoutService } from '../services/authService';

const AuthContext = createContext(null);



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

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


  const logout = async () => {
    try {
      await logoutService();
    } catch {
      // Ignore if Firebase not configured
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
