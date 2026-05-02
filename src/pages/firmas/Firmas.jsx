import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { misSupervisadosApi, firmarRegistroApi } from '../../services/registroService';
import { useAuth } from '../../context/AuthContext';
import SignaturePad from '../../components/ui/SignaturePad';

const formatearFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

const formatearFechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

// Badge de estado global del registro
const BadgeEstado = ({ firmado, firmaEstudiante, firmaDocente, firmaBacteriologo }) => {
  if (firmado) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">
        ✅ Completado
      </span>
    );
  }
  const firmas = [firmaEstudiante, firmaDocente, firmaBacteriologo].filter(Boolean).length;
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">
      ⏳ Pendiente ({firmas}/3)
    </span>
  );
};

// Chip de firma individual
const ChipFirma = ({ tiene, label, fecha }) => (
  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
    tiene ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
  }`}>
    {tiene ? '✓' : '○'} {label}
    {tiene && fecha && (
      <span className="text-green-500 font-normal">
        · {formatearFechaCorta(fecha)}
      </span>
    )}
  </span>
);

const RegistroItem = ({ registro, rol, onActualizado }) => {
  const [expandido, setExpandido] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const firmaRef = useRef(null);

  const estudiante = registro.estudiante?.usuario;
  const entidad = registro.estudiante?.entidad?.nombre;
  const totalExamenes = registro.examenes?.reduce((s, e) => s + e.cantidad, 0) || 0;
  const areas = [...new Set(registro.examenes?.map((e) => e.examen?.area || 'Sin área') || [])].sort();

  const yaFirme = rol === 'docente' ? !!registro.firmaDocente : !!registro.firmaBacteriologo;
  const puedeFirmar = !yaFirme && !registro.firmado;

  const handleFirmar = async (firmaBase64) => {
    setFirmando(true);
    try {
      const { data } = await firmarRegistroApi(registro.id, firmaBase64);
      toast.success('Firma guardada exitosamente');
      onActualizado(data.data);
      setExpandido(false);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar la firma');
      firmaRef.current?.limpiar();
    } finally {
      setFirmando(false);
    }
  };

  return (
    <div className="card p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800">
              {estudiante?.nombre} {estudiante?.apellido}
            </p>
            <BadgeEstado
              firmado={registro.firmado}
              firmaEstudiante={registro.firmaEstudiante}
              firmaDocente={registro.firmaDocente}
              firmaBacteriologo={registro.firmaBacteriologo}
            />
          </div>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {formatearFecha(registro.fecha)}
            {entidad ? ` · ${entidad}` : ''}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <ChipFirma
              tiene={!!registro.firmaEstudiante}
              label="Estudiante"
              fecha={registro.firmaEstudianteFecha}
            />
            <ChipFirma
              tiene={!!registro.firmaDocente}
              label="Docente"
              fecha={registro.firmaDocenteFecha}
            />
            <ChipFirma
              tiene={!!registro.firmaBacteriologo}
              label="Bacteriólogo"
              fecha={registro.firmaBacteriologoFecha}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="badge badge-blue">{totalExamenes} examen{totalExamenes !== 1 ? 'es' : ''}</span>
          {puedeFirmar && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Requiere tu firma
            </span>
          )}
          <span className={`text-gray-400 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {expandido && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Exámenes por área */}
          {areas.length > 0 && (
            <div className="space-y-3">
              {areas.map((area) => {
                const exsArea = registro.examenes.filter((e) => (e.examen?.area || 'Sin área') === area);
                return (
                  <div key={area}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{area}</p>
                    <div className="space-y-1">
                      {exsArea.map((e) => (
                        <div key={e.id} className="flex justify-between text-sm px-3 py-1.5 bg-gray-50 rounded-lg">
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

          {/* Observaciones */}
          {registro.observaciones && (
            <div className="bg-amber-50 rounded-xl px-3 py-2">
              <p className="text-xs font-medium text-amber-700 mb-0.5">Observaciones del estudiante</p>
              <p className="text-sm text-amber-800">{registro.observaciones}</p>
            </div>
          )}

          {/* Pad de firma o estado */}
          {puedeFirmar ? (
            <div className="border-t border-gray-100 pt-4">
              <p className="label mb-1">
                Tu firma ({rol === 'docente' ? 'Docente supervisor' : 'Bacteriólogo encargado'})
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Al firmar confirmas que supervisaste y revisaste este registro.
              </p>
              <SignaturePad ref={firmaRef} disabled={firmando} onFirma={handleFirmar} />
              {firmando && (
                <p className="text-xs text-gray-400 mt-2 text-center animate-pulse">Guardando firma...</p>
              )}
            </div>
          ) : yaFirme ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
              <span>✅</span>
              <span>Ya firmaste este registro el {formatearFechaCorta(
                rol === 'docente' ? registro.firmaDocenteFecha : registro.firmaBacteriologoFecha
              )}</span>
            </div>
          ) : null}

          {registro.firmado && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
              <span>🎉</span>
              <span>Registro completado — firmado por las 3 partes</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Firmas = () => {
  const { usuario } = useAuth();
  const [todos, setTodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('pendientes');

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await misSupervisadosApi();
      setTodos(data.data);
    } catch {
      toast.error('Error al cargar registros');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleActualizado = (registroActualizado) => {
    setTodos((prev) =>
      prev.map((r) => (r.id === registroActualizado.id ? { ...r, ...registroActualizado } : r))
    );
  };

  const rol = usuario?.rol;
  const yaFirme = (r) => rol === 'docente' ? !!r.firmaDocente : !!r.firmaBacteriologo;

  const pendientes = todos.filter((r) => !yaFirme(r) && !r.firmado);
  const completados = todos.filter((r) => r.firmado);
  const enProceso = todos.filter((r) => yaFirme(r) && !r.firmado);

  const lista = tab === 'pendientes' ? pendientes
    : tab === 'proceso' ? enProceso
    : completados;

  const rolLabel = rol === 'docente' ? 'docente supervisor' : 'bacteriólogo encargado';

  const Tab = ({ id, label, count }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
        tab === id
          ? 'bg-up-blue text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
          tab === id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Registros de mis estudiantes</h2>
        <p className="text-gray-500 text-sm mt-1">
          Registros diarios de los estudiantes asignados a ti como {rolLabel}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Tab id="pendientes" label="⏳ Pendientes de mi firma" count={pendientes.length} />
        <Tab id="proceso" label="🔄 En proceso" count={enProceso.length} />
        <Tab id="completados" label="✅ Completados" count={completados.length} />
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-up-blue border-t-transparent" />
        </div>
      ) : lista.length === 0 ? (
        <div className="card text-center py-16">
          <span className="text-5xl">
            {tab === 'pendientes' ? '✅' : tab === 'proceso' ? '🔄' : '📋'}
          </span>
          <p className="mt-3 font-medium text-gray-700">
            {tab === 'pendientes'
              ? 'No hay registros pendientes de tu firma'
              : tab === 'proceso'
              ? 'No hay registros en proceso'
              : 'No hay registros completados aún'}
          </p>
          {tab === 'pendientes' && (
            <p className="text-sm text-gray-400 mt-1">Al día con todas las firmas</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((r) => (
            <RegistroItem
              key={r.id}
              registro={r}
              rol={rol}
              onActualizado={handleActualizado}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Firmas;
