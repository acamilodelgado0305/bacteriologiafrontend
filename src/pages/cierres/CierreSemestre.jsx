import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listarCierresApi, cerrarSemestreApi, eliminarCierreApi } from '../../services/cierreService';
import { listarEstudiantesApi } from '../../services/estudianteService';
import { useAuth } from '../../context/AuthContext';

const formatearFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const ToggleOpcion = ({ activo, onChange, label, descripcion }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
    <button
      type="button"
      onClick={() => onChange(!activo)}
      className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${activo ? 'bg-up-blue' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${activo ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{descripcion}</p>
    </div>
  </div>
);

const GrupoEstudiantes = ({ label, lista, seleccionados, onToggle, onToggleGrupo }) => {
  if (lista.length === 0) return null;
  const ids = lista.map((e) => e.id);
  const todosSeleccionados = ids.every((id) => seleccionados.has(id));
  const algunoSeleccionado = ids.some((id) => seleccionados.has(id));

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label} ({lista.length})
        </span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onToggleGrupo(ids, true)} className="text-xs text-up-blue hover:underline">
            todos
          </button>
          <span className="text-gray-300">·</span>
          <button type="button" onClick={() => onToggleGrupo(ids, false)} className="text-xs text-gray-400 hover:underline">
            ninguno
          </button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
        {lista.map((e) => (
          <label
            key={e.id}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors first:rounded-t-xl last:rounded-b-xl"
          >
            <input
              type="checkbox"
              checked={seleccionados.has(e.id)}
              onChange={() => onToggle(e.id)}
              className="w-4 h-4 accent-up-blue flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {e.usuario.nombre} {e.usuario.apellido}
              </p>
              <p className="text-xs text-gray-400">{e.numeroDocumento}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

const ModalCerrar = ({ onCancelar, onConfirmar, cerrando }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [conservar, setConservar] = useState({ docentes: true, supervisores: true });
  const [estudiantesOpcion, setEstudiantesOpcion] = useState('todos');
  const [semestreDestino, setSemestreDestino] = useState('decimo');
  const [listaEstudiantes, setListaEstudiantes] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const setOpcion = (key, val) => setConservar((prev) => ({ ...prev, [key]: val }));
  const hayDesactivaciones = !conservar.docentes || !conservar.supervisores || estudiantesOpcion !== 'todos';

  useEffect(() => {
    if (estudiantesOpcion !== 'manual') return;
    if (listaEstudiantes.length > 0) return;
    setCargandoEstudiantes(true);
    listarEstudiantesApi()
      .then(({ data }) => {
        const lista = data.data || [];
        setListaEstudiantes(lista);
        setSeleccionados(new Set(lista.map((e) => e.id)));
      })
      .catch(() => toast.error('Error al cargar la lista de estudiantes'))
      .finally(() => setCargandoEstudiantes(false));
  }, [estudiantesOpcion]);

  const toggleEstudiante = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGrupo = (ids, activar) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (activar ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) { toast.error('El nombre del cierre es requerido'); return; }
    onConfirmar({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      conservar: {
        ...conservar,
        estudiantesOpcion,
        ...(estudiantesOpcion !== 'ninguno' ? { semestreDestino } : {}),
        ...(estudiantesOpcion === 'manual' ? { estudiantesIds: [...seleccionados] } : {}),
      },
    });
  };

  const filtrados = listaEstudiantes.filter((e) => {
    const q = busqueda.toLowerCase();
    return (
      e.usuario.nombre.toLowerCase().includes(q) ||
      e.usuario.apellido.toLowerCase().includes(q) ||
      (e.numeroDocumento || '').includes(q)
    );
  });
  const novenos = filtrados.filter((e) => e.semestre === 'noveno');
  const decimos = filtrados.filter((e) => e.semestre === 'decimo');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800">Cerrar Semestre</h3>
          <p className="text-sm text-gray-500 mt-1">
            Los estudiantes y registros activos quedarán archivados en este cierre.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Nombre y descripción */}
            <div className="space-y-4">
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
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
            </div>

            {/* Toggles docentes y supervisores */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                ¿Qué cuentas conservar para el próximo semestre?
              </p>
              <div className="bg-gray-50 rounded-xl px-4 py-1">
                <ToggleOpcion
                  activo={conservar.docentes}
                  onChange={(v) => setOpcion('docentes', v)}
                  label="Docentes"
                  descripcion={conservar.docentes ? 'Sus cuentas permanecen activas.' : 'Sus cuentas serán desactivadas al cerrar.'}
                />
                <ToggleOpcion
                  activo={conservar.supervisores}
                  onChange={(v) => setOpcion('supervisores', v)}
                  label="Supervisores (bacteriólogos)"
                  descripcion={conservar.supervisores ? 'Sus cuentas permanecen activas.' : 'Sus cuentas serán desactivadas al cerrar.'}
                />
              </div>
            </div>

            {/* Select estudiantes */}
            <div>
              <label className="label">Estudiantes</label>
              <select
                value={estudiantesOpcion}
                onChange={(e) => setEstudiantesOpcion(e.target.value)}
                disabled={cerrando}
                className="input-field"
              >
                <option value="todos">Conservar todos</option>
                <option value="noveno">Conservar solo Noveno semestre</option>
                <option value="decimo">Conservar solo Décimo semestre</option>
                <option value="ninguno">Desactivar todos</option>
                <option value="manual">Selección manual...</option>
              </select>
              <p className="text-xs text-gray-400 mt-1.5 px-1">
                Los perfiles y registros siempre se archivan. Esto solo afecta el acceso al sistema.
              </p>
            </div>

            {/* Semestre destino para conservados */}
            {estudiantesOpcion !== 'ninguno' && (
              <div>
                <label className="label">¿En qué semestre quedan los estudiantes conservados?</label>
                <select
                  value={semestreDestino}
                  onChange={(e) => setSemestreDestino(e.target.value)}
                  disabled={cerrando}
                  className="input-field"
                >
                  <option value="noveno">Noveno semestre</option>
                  <option value="decimo">Décimo semestre</option>
                </select>
                <p className="text-xs text-gray-400 mt-1.5 px-1">
                  Su semestre se actualizará al iniciar el siguiente período.
                </p>
              </div>
            )}

            {/* Lista manual */}
            {estudiantesOpcion === 'manual' && (
              <div className="space-y-3">
                {cargandoEstudiantes ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por nombre o documento..."
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 px-1">
                      Marcados conservan acceso · {seleccionados.size} de {listaEstudiantes.length} seleccionados
                    </p>
                    <GrupoEstudiantes
                      label="Noveno semestre"
                      lista={novenos}
                      seleccionados={seleccionados}
                      onToggle={toggleEstudiante}
                      onToggleGrupo={toggleGrupo}
                    />
                    <GrupoEstudiantes
                      label="Décimo semestre"
                      lista={decimos}
                      seleccionados={seleccionados}
                      onToggle={toggleEstudiante}
                      onToggleGrupo={toggleGrupo}
                    />
                    {filtrados.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Sin resultados</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Advertencia */}
            {hayDesactivaciones && (
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
                ⚠️ Las cuentas desactivadas no podrán iniciar sesión. Un administrador puede reactivarlas desde el panel de usuarios.
              </div>
            )}
          </div>

          <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 flex-shrink-0">
            <button type="button" onClick={onCancelar} disabled={cerrando} className="btn-secondary flex-1">
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

const ModalEliminarCierre = ({ cierre, onCancelar, onConfirmar, eliminando }) => {
  const [confirmText, setConfirmText] = useState('');
  const normalizar = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const confirmado = normalizar(confirmText) === normalizar(cierre?.nombre);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-red-700">Eliminar cierre permanentemente</h3>
          <p className="text-sm text-gray-500 mt-1">Esta acción no se puede deshacer.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 rounded-xl p-4 space-y-1.5 text-sm text-red-800">
            <p className="font-semibold">Se eliminará de forma permanente:</p>
            <ul className="list-disc list-inside space-y-1 text-red-700">
              <li>{cierre?.totalEstudiantes} estudiante{cierre?.totalEstudiantes !== 1 ? 's' : ''} archivado{cierre?.totalEstudiantes !== 1 ? 's' : ''} y sus cuentas</li>
              <li>{cierre?.totalRegistros} registro{cierre?.totalRegistros !== 1 ? 's' : ''} diario{cierre?.totalRegistros !== 1 ? 's' : ''} y sus exámenes</li>
              <li>Toda la información del semestre <strong>{cierre?.nombre}</strong></li>
            </ul>
            <p className="text-xs text-red-600 mt-2">
              Las cuentas de estudiantes re-matriculados en el semestre activo no serán eliminadas.
            </p>
          </div>

          <div>
            <label className="label text-sm">
              Escribe <span className="font-semibold text-gray-800">{cierre?.nombre}</span> para confirmar
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={cierre?.nombre}
              disabled={eliminando}
              className="input-field mt-1"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancelar} disabled={eliminando} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={eliminando || !confirmado}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar definitivamente'}
            </button>
          </div>
        </div>
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
  const [cierreEliminar, setCierreEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

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

  const handleCerrar = async ({ nombre, descripcion, conservar }) => {
    setCerrando(true);
    try {
      const { data } = await cerrarSemestreApi({ nombre, descripcion, conservar });
      const { desactivados } = data.data;
      toast.success(data.mensaje || 'Semestre cerrado exitosamente');
      const extras = [
        desactivados.docentes > 0 && `${desactivados.docentes} docente(s) desactivado(s)`,
        desactivados.supervisores > 0 && `${desactivados.supervisores} bacteriólogo(s) desactivado(s)`,
        desactivados.estudiantes > 0 && `${desactivados.estudiantes} estudiante(s) desactivado(s)`,
      ].filter(Boolean);
      if (extras.length > 0) {
        extras.forEach((msg) => toast(msg, { icon: '⚠️' }));
      }
      setMostrarModal(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al cerrar el semestre');
    } finally {
      setCerrando(false);
    }
  };

  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await eliminarCierreApi(cierreEliminar.id);
      setCierres((prev) => prev.filter((c) => c.id !== cierreEliminar.id));
      setCierreEliminar(null);
      toast.success('Cierre eliminado permanentemente');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al eliminar el cierre');
    } finally {
      setEliminando(false);
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
              <div key={c.id} className="card flex items-center gap-4 hover:shadow-md transition-shadow group">
                <Link to={`/cierres/${c.id}`} className="flex items-center gap-4 flex-1 min-w-0">
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
                {esAdmin && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setCierreEliminar(c); }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Eliminar cierre"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
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

      {cierreEliminar && (
        <ModalEliminarCierre
          cierre={cierreEliminar}
          onCancelar={() => setCierreEliminar(null)}
          onConfirmar={handleEliminar}
          eliminando={eliminando}
        />
      )}
    </div>
  );
};

export default CierreSemestre;
