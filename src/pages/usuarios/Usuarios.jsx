import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listarUsuariosApi, actualizarUsuarioApi } from '../../services/userService';

const rolColor = {
  admin: 'badge-blue',
  docente: 'badge-green',
  bacteriologo: 'badge-blue',
  estudiante: 'badge-gray',
};

const Toggle = ({ activo, onChange, cargando }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={cargando}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200
      focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
      ${activo ? 'bg-up-blue' : 'bg-gray-200'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
      ${activo ? 'translate-x-4' : 'translate-x-0'}`}
    />
  </button>
);

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroRol, setFiltroRol] = useState('');
  const [actualizando, setActualizando] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const params = filtroRol ? { rol: filtroRol } : {};
      const { data } = await listarUsuariosApi(params);
      setUsuarios(data.data);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [filtroRol]);

  const toggleActivo = async (u) => {
    setActualizando(u.id + '_activo');
    try {
      const { data } = await actualizarUsuarioApi(u.id, { activo: !u.activo });
      setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, activo: data.data.activo } : x));
      toast.success(`Usuario ${data.data.activo ? 'activado' : 'desactivado'}`);
    } catch {
      toast.error('Error al actualizar usuario');
    } finally {
      setActualizando(null);
    }
  };

  const toggleAdminDocente = async (u) => {
    setActualizando(u.id + '_admin');
    try {
      const { data } = await actualizarUsuarioApi(u.id, { esAdminDocente: !u.esAdminDocente });
      setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, esAdminDocente: data.data.esAdminDocente } : x));
      toast.success(data.data.esAdminDocente ? 'Permisos de admin asignados' : 'Permisos de admin removidos');
    } catch {
      toast.error('Error al actualizar permisos');
    } finally {
      setActualizando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Usuarios</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión de accesos y permisos</p>
        </div>
        <select
          className="input-field w-auto"
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
        >
          <option value="">Todos los roles</option>
          <option value="estudiante">Estudiantes</option>
          <option value="docente">Docentes</option>
          <option value="bacteriologo">Bacteriólogos</option>
          <option value="admin">Administradores</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {cargando ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="text-4xl">👥</span>
            <p className="text-sm mt-2">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Correo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Activo</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    <span className="flex items-center gap-1 justify-center">
                      Permisos admin
                      <span className="text-xs text-gray-400 font-normal">(docentes)</span>
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Último acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.nombre} {u.apellido}
                      {u.esAdminDocente && (
                        <span className="ml-2 text-xs text-up-blue font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${rolColor[u.rol] || 'badge-gray'}`}>{u.rol}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        activo={u.activo}
                        onChange={() => toggleActivo(u)}
                        cargando={actualizando === u.id + '_activo'}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.rol === 'docente' ? (
                        <Toggle
                          activo={!!u.esAdminDocente}
                          onChange={() => toggleAdminDocente(u)}
                          cargando={actualizando === u.id + '_admin'}
                        />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.ultimoAcceso
                        ? new Date(u.ultimoAcceso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Nunca'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;
