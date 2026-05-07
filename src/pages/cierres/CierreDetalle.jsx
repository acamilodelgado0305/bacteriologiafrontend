import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { obtenerCierreApi } from '../../services/cierreService';

const formatearFechaLarga = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

const formatearFechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const BadgeFirmado = ({ firmado }) =>
  firmado ? (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
      ✅ Completo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
      ⏳ Parcial
    </span>
  );

const RegistroFila = ({ registro }) => {
  const [expandido, setExpandido] = useState(false);
  const totalExamenes = registro.examenes?.reduce((s, e) => s + e.cantidad, 0) || 0;
  const areas = [...new Set(registro.examenes?.map((e) => e.examen?.area || 'Sin área') || [])].sort();

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-700 capitalize">
              {formatearFechaLarga(registro.fecha)}
            </p>
            <BadgeFirmado firmado={registro.firmado} />
          </div>
          {(registro.horaEntrada || registro.horaSalida) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {registro.horaEntrada} – {registro.horaSalida}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="badge badge-blue">{totalExamenes} exámenes</span>
          <span className={`text-gray-400 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {expandido && (
        <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
          {/* Supervisores */}
          {(registro.docenteSupervisor || registro.bacteriologoSupervisor) && (
            <div className="grid grid-cols-2 gap-2">
              {registro.docenteSupervisor && (
                <div className="bg-blue-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-blue-600">Docente</p>
                  <p className="text-sm text-blue-900">
                    {registro.docenteSupervisor.nombre} {registro.docenteSupervisor.apellido}
                  </p>
                </div>
              )}
              {registro.bacteriologoSupervisor && (
                <div className="bg-purple-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-purple-600">Bacteriólogo</p>
                  <p className="text-sm text-purple-900">
                    {registro.nombreFirmanteBacteriologo || `${registro.bacteriologoSupervisor.nombre} ${registro.bacteriologoSupervisor.apellido}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Exámenes por área */}
          {areas.length > 0 && (
            <div className="space-y-2">
              {areas.map((area) => {
                const exsArea = registro.examenes.filter((e) => (e.examen?.area || 'Sin área') === area);
                return (
                  <div key={area}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{area}</p>
                    <div className="space-y-1">
                      {exsArea.map((e) => (
                        <div key={e.id} className="flex justify-between text-sm px-3 py-1.5 bg-white rounded-lg border border-gray-100">
                          <span className="text-gray-700">{e.examen?.nombre}</span>
                          <span className="font-semibold text-gray-800">{e.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {registro.observaciones && (
            <div className="bg-amber-50 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-amber-700 mb-0.5">Observaciones</p>
              <p className="text-sm text-amber-800">{registro.observaciones}</p>
            </div>
          )}

          {/* Estado de firmas */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { tiene: !!registro.firmaEstudiante, label: 'Estudiante', fecha: registro.firmaEstudianteFecha },
              { tiene: !!registro.firmaDocente, label: 'Docente', fecha: registro.firmaDocenteFecha },
              { tiene: !!registro.firmaBacteriologo, label: 'Bacteriólogo', fecha: registro.firmaBacteriologoFecha },
            ].map(({ tiene, label, fecha }) => (
              <span key={label} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                tiene ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tiene ? '✓' : '○'} {label}
                {tiene && fecha && <span className="font-normal opacity-70">· {formatearFechaCorta(fecha)}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const EstudianteCard = ({ item }) => {
  const [expandido, setExpandido] = useState(false);
  const { estudiante, registros, totalExamenes } = item;
  // el objeto estudiante viene con usuario y entidad como relaciones del propio modelo
  const usuario = estudiante?.usuario;

  return (
    <div className="card p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-up-blue/10 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">👤</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800">
            {usuario?.nombre} {usuario?.apellido}
          </p>
          <p className="text-sm text-gray-500">
            {estudiante?.entidad?.nombre || 'Sin entidad'} · {estudiante?.semestre}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{registros.length}</p>
            <p className="text-xs text-gray-400">días</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{totalExamenes}</p>
            <p className="text-xs text-gray-400">exámenes</p>
          </div>
          <span className={`text-gray-400 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {expandido && (
        <div className="border-t border-gray-100 p-4 space-y-2">
          {registros.map((r) => (
            <RegistroFila key={r.id} registro={r} />
          ))}
        </div>
      )}
    </div>
  );
};

const CierreDetalle = () => {
  const { id } = useParams();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await obtenerCierreApi(id);
        setDatos(data.data);
      } catch {
        toast.error('Error al cargar el cierre');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  const estudiantesFiltrados = datos?.estudiantes?.filter((item) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    const u = item.estudiante?.usuario;
    return (
      u?.nombre?.toLowerCase().includes(q) ||
      u?.apellido?.toLowerCase().includes(q) ||
      item.estudiante?.entidad?.nombre?.toLowerCase().includes(q)
    );
  }) || [];

  if (cargando) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-up-blue border-t-transparent" />
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Cierre no encontrado</p>
        <Link to="/cierres" className="text-up-blue text-sm mt-2 inline-block">← Volver</Link>
      </div>
    );
  }

  const { cierre, estudiantes } = datos;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Encabezado */}
      <div>
        <Link to="/cierres" className="text-sm text-up-blue hover:underline">← Archivo de semestres</Link>
        <div className="flex items-start gap-4 mt-3">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📁</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{cierre.nombre}</h2>
            {cierre.descripcion && (
              <p className="text-gray-500 text-sm mt-0.5">{cierre.descripcion}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Cerrado el {new Date(cierre.fechaCierre).toLocaleDateString('es-CO', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-up-blue">{cierre.totalEstudiantes}</p>
          <p className="text-sm text-gray-500 mt-1">Estudiantes</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-up-blue">{cierre.totalRegistros}</p>
          <p className="text-sm text-gray-500 mt-1">Registros archivados</p>
        </div>
      </div>

      {/* Búsqueda */}
      {estudiantes.length > 0 && (
        <div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar estudiante o entidad..."
            className="input-field"
          />
        </div>
      )}

      {/* Lista de estudiantes */}
      {estudiantesFiltrados.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">🔍</span>
          <p className="mt-3 font-medium text-gray-700">
            {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay estudiantes en este cierre'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {estudiantesFiltrados.map((item) => (
            <EstudianteCard key={item.estudiante.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CierreDetalle;
