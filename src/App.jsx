import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import Dashboard from './pages/dashboard/Dashboard';
import Usuarios from './pages/usuarios/Usuarios';
import Entidades from './pages/entidades/Entidades';
import EntidadDetalle from './pages/entidades/EntidadDetalle';
import Estudiantes from './pages/estudiantes/Estudiantes';
import Docentes from './pages/docentes/Docentes';
import Bacteriologos from './pages/bacteriologos/Bacteriologos';
import RegistroDiario from './pages/registro/RegistroDiario';
import Firmas from './pages/firmas/Firmas';
import Reportes from './pages/reportes/Reportes';
import Placeholder from './pages/Placeholder';

const App = () => (
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/registros" element={<RegistroDiario />} />
          <Route path="/reportes" element={<Reportes />} />

          <Route element={<ProtectedRoute roles={['docente', 'bacteriologo']} />}>
            <Route path="/firmas" element={<Firmas />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'docente']} />}>
            <Route path="/entidades" element={<Entidades />} />
            <Route path="/entidades/:id" element={<EntidadDetalle />} />
            <Route path="/estudiantes" element={<Estudiantes />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/docentes" element={<Docentes />} />
            <Route path="/bacteriologos" element={<Bacteriologos />} />
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </AuthProvider>
);

export default App;
