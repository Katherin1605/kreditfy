import { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const decodeJWT = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  // Shared promise while a refresh is in flight — prevents parallel refresh races
  const refreshPromiseRef = useRef(null);

  const clearSession = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  const applyToken = (token) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  useEffect(() => {
    const stored = localStorage.getItem('admin');
    const token  = localStorage.getItem('token');
    if (stored && token) {
      const adminData = JSON.parse(stored);
      // Patch tenant_id / tenant_name from token if the stored object predates these fields
      if (adminData.tenant_id === undefined || adminData.tenant_name === undefined) {
        const decoded = decodeJWT(token);
        if (decoded) {
          adminData.tenant_id   = decoded.tenant_id   ?? null;
          adminData.tenant_name = decoded.tenant_name ?? null;
        }
      }
      setCurrentAdmin(adminData);
      applyToken(token);
    }
    setLoading(false);

    const interceptor = axios.interceptors.response.use(
      res => res,
      async err => {
        const original    = err.config;
        const isAuthRoute = original?.url?.includes('/auth/');

        if ((err.response?.status === 401 || err.response?.status === 403) && !isAuthRoute && !original._retry) {
          original._retry = true;

          try {
            // If another request already started a refresh, reuse that promise
            if (!refreshPromiseRef.current) {
              const storedRefresh = localStorage.getItem('refreshToken');
              if (!storedRefresh) throw new Error('no refresh token');

              refreshPromiseRef.current = axios
                .post('http://localhost:3000/auth/refresh', { refreshToken: storedRefresh })
                .finally(() => { refreshPromiseRef.current = null; });
            }

            const { data } = await refreshPromiseRef.current;
            const { token, refreshToken } = data;

            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            applyToken(token);
            original.headers['Authorization'] = `Bearer ${token}`;

            return axios(original);
          } catch {
            clearSession();
            window.location.href = '/login';
          }
        }

        return Promise.reject(err);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = (adminData, token, refreshToken) => {
    setCurrentAdmin(adminData);
    localStorage.setItem('admin', JSON.stringify(adminData));
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    applyToken(token);
  };

  const logout = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ currentAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
