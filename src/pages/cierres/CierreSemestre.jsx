import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listarCierresApi, cerrarSemestreApi } from '../../services/cierreService';
import { useAuth } from '../../context/AuthContext';

const formatearFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const ModalCerrar = ({ onCancelar, onConfirmar, cerrando }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre del cierre es requerido');
      return;
    }
    onConfirmar({ nombre: nombre.trim(), descripcion: descripcion.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Cerrar Semestre</h3>
          <p className="text-sm text-gray-500 mt-1">
            Todos los registros activos serán archivados. Esta acción no se puede deshacer.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nombre del semestre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Semestre I - 2026"
              disabled={cerrando}
              className="input-field"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Descripción (opcional)</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Observaciones del cierre..."
              disabled={cerrando}
              rows={3}
              className="input-field resize-none"
            />
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
            ⚠️ Esta acción archivará todos los estudiantes y registros activos. Las entidades y supervisores se mantienen intactos.
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancelar}
              disabled={cerrando}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cerrando || !nombre.trim()}
              className="btn-primary flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {cerrando ? 'Cerrando...' : 'Cerrar Semestre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CierreSemestre = () => {
  const { usuario } = useAuth();
  const [cierres, setCierres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const esAdmin = usuario?.rol === 'admin' || usuario?.esAdminDocente;

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await listarCierresApi();
      setCierres(data.data);
    } catch {
      toast.error('Error al cargar los cierres');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleCerrar = async ({ nombre, descripcion }) => {
    setCerrando(true);
    try {
      const { data } = await cerrarSemestreApi({ nombre, descripcion });
      toast.success(data.mensaje || 'Semestre cerrado exitosamente');
      setMostrarModal(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al cerrar el semestre');
    } finally {
      setCerrando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Archivo de Semestres</h2>
          <p className="text-gray-500 text-sm mt-1">
            Historial de cierres anteriores y gestión del semestre activo.
          </p>
        </div>
        {esAdmin && (
          <button
            type="button"
            onClick={() => setMostrarModal(true)}
            className="btn-primary bg-red-600 hover:bg-red-700 flex-shrink-0"
          >
            🔒 Cerrar Semestre
          </button>
        )}
      </div>

      {/* Semestre activo */}
      <div className="card bg-green-50 border border-green-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📂</span>
          <div>
            <p className="font-semibold text-green-800">Semestre activo en curso</p>
            <p className="text-sm text-green-600">
              Los registros nuevos se guardan aquí hasta que se cierre el semestre.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de cierres */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Semestres archivados ({cierres.length})
        </h3>

        {cargando ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-up-blue border-t-transparent" />
          </div>
        ) : cierres.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-4xl">🗄️</span>
            <p className="mt-3 font-medium text-gray-700">No hay semestres archivados aún</p>
            <p className="text-sm text-gray-400 mt-1">
              Al cerrar el semestre, aparecerá aquí para consulta.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cierres.map((c) => (
              <Link
                key={c.id}
                to={`/cierres/${c.id}`}
                className="card flex items-center gap-4 hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-up-blue/10 transition-colors">
                  <span className="text-2xl">📁</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 group-hover:text-up-blue transition-colors">
                    {c.nombre}
                  </p>
                  {c.descripcion && (
                    <p className="text-sm text-gray-500 truncate">{c.descripcion}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Cerrado el {formatearFecha(c.fechaCierre)}
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0 text-right">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{c.totalEstudiantes}</p>
                    <p className="text-xs text-gray-400">estudiantes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{c.totalRegistros}</p>
                    <p className="text-xs text-gray-400">registros</p>
                  </div>
                  <span className="text-gray-300 self-center">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {mostrarModal && (
        <ModalCerrar
          onCancelar={() => setMostrarModal(false)}
          onConfirmar={handleCerrar}
          cerrando={cerrando}
        />
      )}
    </div>
  );
};

export default CierreSemestre;
