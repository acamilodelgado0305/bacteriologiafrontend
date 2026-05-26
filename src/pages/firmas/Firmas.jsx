import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { misSupervisadosApi, firmarRegistroApi } from '../../services/registroService';
import { useAuth } from '../../context/AuthContext';
import SignaturePad from '../../components/ui/SignaturePad';

const formatearFecha = (iso) =>
  new Date(iso.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

const formatearFechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const esCompleto = (r) => r.firmado || (!!r.firmaEstudiante && !!r.firmaDocente && !!r.firmaBacteriologo);

const BadgeEstado = ({ firmado, firmaEstudiante, firmaDocente }) => {
  if (firmado || (firmaEstudiante && firmaDocente)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">
        ✅ Completado
      </span>
    );
  }
  const firmas = [firmaEstudiante, firmaDocente].filter(Boolean).length;
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">
      ⏳ Pendiente ({firmas}/2)
    </span>
  );
};

const ChipFirma = ({ tiene, label, fecha }) => (
  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
    tiene ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
  }`}>
    {tiene ? '✓' : '○'} {label}
    {tiene && fecha && (
      <span className="text-green-500 font-normal">
        · {new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
      </span>
    )}
  </span>
);

const RegistroItem = ({ registro, onActualizado }) => {
  const [mostrarFirma, setMostrarFirma] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [obsDocente, setObsDocente] = useState('');
  const firmaRef = useRef(null);

  const estudiante = registro.estudiante?.usuario;
  const entidad = registro.estudiante?.entidad?.nombre;
  const totalExamenes = registro.examenes?.reduce((s, e) => s + e.cantidad, 0) || 0;
  const areas = [...new Set(registro.examenes?.map((e) => e.examen?.area || 'Sin área') || [])].sort();

  const yaFirme = !!registro.firmaDocente;
  const completo = esCompleto(registro);
  const puedeFirmar = !yaFirme && !completo;

  const handleFirmar = async (firmaBase64) => {
    setFirmando(true);
    try {
      const { data } = await firmarRegistroApi(registro.id, firmaBase64, '', obsDocente);
      toast.success('Firma guardada exitosamente');
      onActualizado(data.data);
      setMostrarFirma(false);
      setObsDocente('');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar la firma');
      firmaRef.current?.limpiar();
    } finally {
      setFirmando(false);
    }
  };

  return (
    <div className="card p-4 space-y-3">
      {/* Cabecera */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 leading-snug">
            {estudiante?.nombre} {estudiante?.apellido}
          </p>
          <p className="text-sm text-gray-500 mt-0.5 capitalize leading-snug">
            {formatearFecha(registro.fecha)}
            {entidad ? ` · ${entidad}` : ''}
          </p>
        </div>
        <span className="badge badge-blue flex-shrink-0 mt-0.5">{totalExamenes} ex.</span>
      </div>

      {/* Estado y chips */}
      <div className="flex flex-wrap gap-1.5">
        <BadgeEstado
          firmado={registro.firmado}
          firmaEstudiante={registro.firmaEstudiante}
          firmaDocente={registro.firmaDocente}
        />
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
      </div>

      {/* Botón firmar */}
      {puedeFirmar && !mostrarFirma && (
        <button
          type="button"
          onClick={() => setMostrarFirma(true)}
          className="w-full py-2.5 rounded-xl bg-up-blue text-white text-sm font-semibold hover:bg-blue-900 transition-colors"
        >
          ✍️ Firmar registro
        </button>
      )}

      {/* Panel de firma */}
      {mostrarFirma && puedeFirmar && (
        <div className="border-t border-gray-100 pt-3 space-y-4">
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

          {registro.observaciones && (
            <div className="bg-amber-50 rounded-xl px-3 py-2">
              <p className="text-xs font-medium text-amber-700 mb-0.5">Observaciones del estudiante</p>
              <p className="text-sm text-amber-800">{registro.observaciones}</p>
            </div>
          )}

          {/* Observaciones del docente */}
          <div>
            <label className="label mb-1">Observaciones del docente (opcional)</label>
            <textarea
              rows={3}
              value={obsDocente}
              onChange={(e) => setObsDocente(e.target.value)}
              disabled={firmando}
              placeholder="Escribe aquí tus observaciones sobre la jornada de práctica..."
              className="input-field resize-none disabled:bg-gray-50 disabled:text-gray-400 w-full"
            />
          </div>

          <div>
            <p className="label mb-1">Tu firma (Docente supervisor)</p>
            <p className="text-xs text-gray-400 mb-1">
              Al firmar confirmas que supervisaste y revisaste este registro.
            </p>
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1.5 mb-3">
              🎉 Esta información será consolidada junto con el bacteriólogo encargado.
            </p>
            <SignaturePad ref={firmaRef} disabled={firmando} onFirma={handleFirmar} />
          </div>

          {firmando && (
            <p className="text-xs text-gray-400 text-center animate-pulse">Guardando firma...</p>
          )}

          <button
            type="button"
            onClick={() => { setMostrarFirma(false); firmaRef.current?.limpiar(); }}
            disabled={firmando}
            className="w-full py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Estado firmado */}
      {yaFirme && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
            <p className="font-medium">✅ Firmado el {formatearFechaCorta(registro.firmaDocenteFecha)}</p>
          </div>
          {registro.observacionesDocente && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 mb-1">📝 Mis observaciones</p>
              <p className="text-sm text-blue-800">{registro.observacionesDocente}</p>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
            <span>🎉</span>
            <span>Esta información ha sido consolidada junto con el bacteriólogo encargado</span>
          </div>
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

  const yaFirme = (r) => !!r.firmaDocente;

  const pendientes = todos.filter((r) => !yaFirme(r) && !esCompleto(r));
  const completados = todos.filter((r) => esCompleto(r));
  const enProceso = todos.filter((r) => yaFirme(r) && !esCompleto(r));

  const lista = tab === 'pendientes' ? pendientes
    : tab === 'proceso' ? enProceso
    : completados;

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
        <h2 className="text-2xl font-bold text-gray-800">Registros donde soy supervisor</h2>
        <p className="text-gray-500 text-sm mt-1">
          Registros diarios en los que fuiste seleccionado como docente supervisor
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
              onActualizado={handleActualizado}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Firmas;
