import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loginWithGoogle = () => {
    window.location.href = 'http://localhost:8081/oauth2/authorization/google';
  };

  const loginWithFacebook = () => {
    window.location.href = 'http://localhost:8081/oauth2/authorization/facebook';
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:8081/logout', {}, { withCredentials: true });
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const { data } = await axios.get('http://localhost:8081/api/auth/user', { withCredentials: true });
      setUser(data.user);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithFacebook, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}