import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listarUsuariosApi, actualizarUsuarioApi, cambiarPasswordApi, eliminarUsuarioApi } from '../../services/userService';

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
  const [modalPassword, setModalPassword] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [guardando, setGuardando] = useState(false);

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

  const abrirModalPassword = (u) => {
    setModalPassword(u);
    setNuevaPassword('');
    setConfirmPassword('');
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (nuevaPassword.length < 8) return toast.error('Mínimo 8 caracteres');
    if (nuevaPassword !== confirmPassword) return toast.error('Las contraseñas no coinciden');
    setGuardando(true);
    try {
      await cambiarPasswordApi(modalPassword.id, { password_nueva: nuevaPassword });
      toast.success('Contraseña actualizada');
      setModalPassword(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    setGuardando(true);
    try {
      await eliminarUsuarioApi(modalEliminar.id);
      setUsuarios((prev) => prev.filter((x) => x.id !== modalEliminar.id));
      toast.success('Usuario eliminado');
      setModalEliminar(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al eliminar usuario');
    } finally {
      setGuardando(false);
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
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
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
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => abrirModalPassword(u)}
                          title="Cambiar contraseña"
                          className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-up-blue transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalEliminar(u)}
                          title="Eliminar usuario"
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/>
                            <path d="M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Cambiar contraseña */}
      {modalPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Cambiar contraseña</h3>
            <p className="text-sm text-gray-500 mb-4">
              {modalPassword.nombre} {modalPassword.apellido}
            </p>
            <form onSubmit={handleCambiarPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  className="input-field"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar contraseña</label>
                <input
                  type="password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalPassword(null)}
                  className="btn-secondary flex-1"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Eliminar usuario */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Eliminar usuario</h3>
            <p className="text-sm text-gray-500 mb-3">
              ¿Estás seguro de que deseas eliminar a{' '}
              <span className="font-medium text-gray-700">
                {modalEliminar.nombre} {modalEliminar.apellido}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            {modalEliminar.rol === 'estudiante' && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-xs text-red-700">
                <span className="font-semibold">Advertencia:</span> este usuario es estudiante. Se eliminarán también su perfil y <span className="font-semibold">todos sus registros diarios</span>, incluyendo exámenes y firmas registradas.
              </div>
            )}
            {(modalEliminar.rol === 'docente' || modalEliminar.rol === 'bacteriologo') && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-xs text-amber-700">
                <span className="font-semibold">Advertencia:</span> este usuario figura como supervisor en registros diarios de estudiantes. Al eliminarlo, <span className="font-semibold">quedará desvinculado de esos registros</span> pero los registros no se borrarán.
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModalEliminar(null)}
                className="btn-secondary flex-1"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminar}
                className="btn-danger flex-1"
                disabled={guardando}
              >
                {guardando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
