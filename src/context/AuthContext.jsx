import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, perfilApi } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setCargando(false); return; }
    try {
      const { data } = await perfilApi();
      setUsuario(data.data);
    } catch {
      localStorage.clear();
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarPerfil(); }, [cargarPerfil]);

  const login = async (email, password) => {
    const { data } = await loginApi(email, password);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUsuario(data.data.usuario);
    return data.data.usuario;
  };

  const logout = () => { localStorage.clear(); setUsuario(null); };

  // Un docente con esAdminDocente tiene permisos de admin
  const esAdmin    = usuario?.rol === 'admin' || (usuario?.rol === 'docente' && !!usuario?.esAdminDocente);
  const esDocente  = usuario?.rol === 'docente';
  const esEstudiante = usuario?.rol === 'estudiante';
  const esBacteriologo = usuario?.rol === 'bacteriologo';

  return (
    <AuthContext.Provider value={{
      usuario, cargando, login, logout, cargarPerfil,
      esAdmin, esDocente, esEstudiante, esBacteriologo,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
