import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { loginWithEmail, logout as logoutService } from '../services/authService';

const AuthContext = createContext(null);



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MOCK LOGIN: Recupera usuário falso do localStorage
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Verifica as credenciais específicas solicitadas
    if (email === 'admin@mrdstore.com.br' && password === 'admin') {
      const mockUserObj = { email, uid: 'admin-id', role: 'admin' };
      localStorage.setItem('mockUser', JSON.stringify(mockUserObj));
      setUser(mockUserObj);
      return mockUserObj;
    } else {
      // Simula erro de credenciais inválidas para o Login.jsx exibir
      const error = new Error('Credenciais inválidas');
      error.code = 'auth/invalid-credential';
      throw error;
    }
  };

  const logout = async () => {
    // MOCK LOGOUT: Remove do localStorage
    localStorage.removeItem('mockUser');
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
