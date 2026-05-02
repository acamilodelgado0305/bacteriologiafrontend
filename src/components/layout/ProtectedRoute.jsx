import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ roles }) => {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-up-blue border-t-transparent" />
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;

  if (roles) {
    const rolOk = roles.includes(usuario.rol);
    // Docente con esAdminDocente puede acceder a cualquier ruta que permita 'admin'
    const adminDocenteOk = usuario.esAdminDocente && roles.includes('admin');
    if (!rolOk && !adminDocenteOk) return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
