import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { miPerfilEstudianteApi, obtenerPorFechaApi, guardarRegistroApi } from '../../services/registroService';
import { useAuth } from '../../context/AuthContext';
import SignaturePad from '../../components/ui/SignaturePad';

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatearFecha = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

const formatearFechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const FilaFirmante = ({ icono, rol, nombre, firmante, fechaFirma }) => (
  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
    fechaFirma ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
  }`}>
    <span className="text-xl flex-shrink-0">{fechaFirma ? '✅' : icono}</span>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{rol}</p>
      <p className={`text-sm font-medium truncate ${nombre ? 'text-gray-800' : 'text-gray-400 italic'}`}>
        {nombre || 'Sin asignar'}
      </p>
      {firmante && (
        <p className="text-xs text-green-600 mt-0.5">Firmó: {firmante}</p>
      )}
    </div>
    <div className="text-right flex-shrink-0">
      {fechaFirma ? (
        <p className="text-xs text-green-600 font-medium">{formatearFechaCorta(fechaFirma)}</p>
      ) : (
        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
          Pendiente
        </span>
      )}
    </div>
  </div>
);

export default function RegistroDiario() {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [fecha, setFecha] = useState(hoy());
  const [cantidades, setCantidades] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [horaEntrada, setHoraEntrada] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [docenteId, setDocenteId] = useState('');
  const [registroExistente, setRegistroExistente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoFecha, setCargandoFecha] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const firmaRef = useRef(null);

  useEffect(() => {
    miPerfilEstudianteApi()
      .then(({ data }) => setPerfil(data.data))
      .catch(() => toast.error('Error al cargar tu perfil'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!perfil?.entidad?.examenes) return;
    setCantidades((prev) => {
      const init = {};
      perfil.entidad.examenes.forEach((ex) => { init[ex.id] = prev[ex.id] ?? 0; });
      return init;
    });
  }, [perfil]);

  const cargarRegistroPorFecha = useCallback(async (f) => {
    if (!perfil) return;
    setCargandoFecha(true);
    try {
      const { data } = await obtenerPorFechaApi(f);
      const reg = data.data;
      setRegistroExistente(reg);
      firmaRef.current?.limpiar();
      if (reg) {
        const mapa = {};
        perfil.entidad?.examenes?.forEach((ex) => { mapa[ex.id] = 0; });
        reg.examenes.forEach((re) => { mapa[re.examenId] = re.cantidad; });
        setCantidades(mapa);
        setObservaciones(reg.observaciones || '');
        setHoraEntrada(reg.horaEntrada || '');
        setHoraSalida(reg.horaSalida || '');
        setDocenteId(reg.docenteSupervisorId || '');
      } else {
        const mapa = {};
        perfil.entidad?.examenes?.forEach((ex) => { mapa[ex.id] = 0; });
        setCantidades(mapa);
        setObservaciones('');
        setHoraEntrada('');
        setHoraSalida('');
        setDocenteId('');
      }
    } catch {
      toast.error('Error al cargar el registro');
    } finally {
      setCargandoFecha(false);
    }
  }, [perfil]);

  useEffect(() => { cargarRegistroPorFecha(fecha); }, [fecha, cargarRegistroPorFecha]);

  const cambiarCantidad = (examenId, valor) => {
    const num = Math.max(0, parseInt(valor) || 0);
    setCantidades((prev) => ({ ...prev, [examenId]: num }));
  };
  const incrementar = (id) => setCantidades((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const decrementar = (id) => setCantidades((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));

  const totalExamenes = Object.values(cantidades).reduce((s, v) => s + v, 0);

  const handleGuardar = async () => {
    if (totalExamenes === 0) {
      toast.error('Debes registrar al menos un examen o actividad');
      return;
    }
    if (!docenteId) {
      toast.error('Debes seleccionar el docente supervisor de esta jornada');
      return;
    }
    if (firmaRef.current?.estaVacio()) {
      toast.error('Debes firmar el registro antes de guardar');
      return;
    }
    const firma = firmaRef.current?.obtenerFirma();
    setGuardando(true);
    try {
      const examenes = Object.entries(cantidades)
        .map(([examenId, cantidad]) => ({ examenId, cantidad }))
        .filter((e) => e.cantidad > 0);

      const { data } = await guardarRegistroApi({
        fecha, examenes, observaciones, firma,
        horaEntrada: horaEntrada || null,
        horaSalida: horaSalida || null,
        docenteSupervisorId: docenteId,
      });
      setRegistroExistente(data.data);
      firmaRef.current?.limpiar();
      toast.success('Registro guardado y firmado exitosamente');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return (
    <div className="flex justify-center items-center py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-up-blue border-t-transparent" />
    </div>
  );

  if (!perfil) return (
    <div className="card text-center py-16">
      <span className="text-5xl">⚠️</span>
      <p className="mt-3 font-medium text-gray-700">No se encontró tu perfil de estudiante</p>
      <p className="text-sm text-gray-400 mt-1">Contacta al administrador</p>
    </div>
  );

  if (!perfil.entidad) return (
    <div className="card text-center py-16">
      <span className="text-5xl">🏥</span>
      <p className="mt-3 font-medium text-gray-700">No tienes una entidad de práctica asignada</p>
      <p className="text-sm text-gray-400 mt-1">Contacta a tu docente o al administrador</p>
    </div>
  );

  const examenes = perfil.entidad.examenes || [];
  const areas = [...new Set(examenes.map((e) => e.area || 'Sin área'))].sort();
  const yaFirmo = !!registroExistente?.firmaEstudiante;
  const firmado = registroExistente?.firmado || (!!registroExistente?.firmaEstudiante && !!registroExistente?.firmaDocente);
  const editable = !yaFirmo && !firmado;

  const personal = perfil.entidad.personal || [];
  const docentes = personal.filter((p) => p.usuario.rol === 'docente');

  const nombreEstudiante = `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim();

  const nombreDocente = registroExistente?.docenteSupervisor
    ? `${registroExistente.docenteSupervisor.nombre} ${registroExistente.docenteSupervisor.apellido}`
    : docenteId
      ? (() => { const d = docentes.find((p) => p.usuarioId === docenteId); return d ? `${d.usuario.nombre} ${d.usuario.apellido}` : null; })()
      : null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Registro Diario</h2>
        <p className="text-xs text-up-blue font-medium mt-0.5">Exámenes y Actividades</p>
        <p className="text-gray-500 text-sm mt-1">
          {perfil.entidad.nombre}
          {perfil.entidad.ciudad ? ` · ${perfil.entidad.ciudad}` : ''}
        </p>
      </div>

      {/* Selector de fecha */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">Fecha del registro</p>
            <p className="font-semibold text-gray-800 capitalize">{formatearFecha(fecha)}</p>
          </div>
          <input
            type="date"
            value={fecha}
            max={hoy()}
            onChange={(e) => setFecha(e.target.value)}
            className="input-field w-auto"
            disabled={guardando}
          />
        </div>

        {firmado && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <span>✅</span><span>Registro completamente firmado</span>
          </div>
        )}
        {yaFirmo && !firmado && !registroExistente?.firmaDocente && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
            <span>✍️</span><span>Ya firmaste este registro — esperando la firma del docente</span>
          </div>
        )}

        {/* Horas de entrada y salida */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs">🕐 Hora de entrada</label>
            <input
              type="time"
              value={horaEntrada}
              onChange={(e) => setHoraEntrada(e.target.value)}
              disabled={!editable}
              className="input-field disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="label text-xs">🕔 Hora de salida</label>
            <input
              type="time"
              value={horaSalida}
              onChange={(e) => setHoraSalida(e.target.value)}
              disabled={!editable}
              className="input-field disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Docente supervisor de la jornada */}
      <div className="card space-y-3">
        <div>
          <h3 className="font-semibold text-gray-800">Docente supervisor de esta jornada</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Selecciona qué docente te supervisó hoy.
          </p>
        </div>

        <div>
          <label className="label text-xs">Docente supervisor *</label>
          {editable ? (
            docentes.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                No hay docentes asignados a esta entidad
              </p>
            ) : (
              <select
                className="input-field"
                value={docenteId}
                onChange={(e) => setDocenteId(e.target.value)}
                disabled={guardando}
              >
                <option value="">Seleccionar docente...</option>
                {docentes.map((p) => (
                  <option key={p.usuarioId} value={p.usuarioId}>
                    {p.usuario.nombre} {p.usuario.apellido}
                  </option>
                ))}
              </select>
            )
          ) : (
            <p className="text-sm font-medium text-gray-700 px-1">
              {nombreDocente || <span className="text-gray-400 italic">No asignado</span>}
            </p>
          )}
        </div>
      </div>

      {cargandoFecha ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
        </div>
      ) : examenes.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          <span className="text-4xl">🧪</span>
          <p className="mt-2 text-sm">No hay exámenes o actividades configurados para tu entidad</p>
        </div>
      ) : (
        <>
          {/* Exámenes y actividades por área */}
          {areas.map((area) => {
            const exsArea = examenes.filter((e) => (e.area || 'Sin área') === area);
            const totalArea = exsArea.reduce((s, e) => s + (cantidades[e.id] || 0), 0);
            return (
              <div key={area} className="card p-0 overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 text-sm">{area}</span>
                  {totalArea > 0 && (
                    <span className="badge badge-blue">
                      {area === 'Administrativos'
                        ? `${totalArea} actividad${totalArea !== 1 ? 'es' : ''}`
                        : `${totalArea} examen${totalArea !== 1 ? 'es' : ''}`}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-50">
                  {exsArea.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between px-4 py-3 gap-4">
                      <span className="text-sm text-gray-800 flex-1">{ex.nombre}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button type="button" onClick={() => decrementar(ex.id)}
                          disabled={!editable || (cantidades[ex.id] || 0) === 0}
                          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                          −
                        </button>
                        <input
                          type="number" min="0"
                          value={cantidades[ex.id] || 0}
                          onChange={(e) => cambiarCantidad(ex.id, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => { if (e.target.value === '' || isNaN(e.target.value)) cambiarCantidad(ex.id, 0); }}
                          disabled={!editable}
                          className="w-16 text-center border border-gray-200 rounded-lg py-1.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-up-blue disabled:bg-gray-50 disabled:text-gray-400"
                        />
                        <button type="button" onClick={() => incrementar(ex.id)}
                          disabled={!editable}
                          className="w-8 h-8 rounded-lg bg-up-blue text-white font-bold hover:bg-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Observaciones */}
          <div className="card">
            <label className="label">Observaciones del día (opcional)</label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={!editable}
              placeholder=""
              className="input-field resize-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Firma + guardar (solo si aún no firmó) */}
          {editable && (
            <div className="card space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800">Tu firma</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Al firmar confirmas que los exámenes registrados son correctos. Luego ya no podrás editar este registro.
                </p>
              </div>

              <SignaturePad ref={firmaRef} ocultarConfirmar disabled={guardando} />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
                <div>
                  <p className="text-xs text-gray-400">Total de exámenes y actividades</p>
                  <p className="text-2xl font-bold text-gray-800">{totalExamenes}</p>
                </div>
                <button
                  onClick={handleGuardar}
                  disabled={guardando || totalExamenes === 0}
                  className="w-full sm:w-auto justify-center bg-up-blue text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {guardando ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>✍️ {registroExistente ? 'Actualizar y firmar' : 'Guardar y firmar'}</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Estado de firmas — siempre visible cuando hay registro */}
          {registroExistente && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Estado de firmas</h3>
                {firmado ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                    ✅ Completado
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                    ⏳ Pendiente
                  </span>
                )}
              </div>

              <FilaFirmante
                icono="👨‍🎓"
                rol="Estudiante"
                nombre={nombreEstudiante}
                fechaFirma={registroExistente.firmaEstudianteFecha}
              />
              <FilaFirmante
                icono="👩‍🏫"
                rol="Docente supervisor"
                nombre={nombreDocente}
                fechaFirma={registroExistente.firmaDocenteFecha}
              />

              {registroExistente.observacionesDocente && (
                <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 mb-1">📝 Observaciones del docente</p>
                  <p className="text-sm text-blue-800">{registroExistente.observacionesDocente}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
