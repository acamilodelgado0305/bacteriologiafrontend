import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  obtenerEntidadApi, crearExamenApi, actualizarExamenApi, importarExamenesApi,
  agregarPersonalEntidadApi, eliminarPersonalEntidadApi,
  listarEntidadesApi, listarExamenesApi,
} from '../../services/entidadService';
import { crearUsuarioApi, listarUsuariosApi } from '../../services/userService';
import {
  listarEstudiantesApi, crearEstudianteApi,
  actualizarEstudianteApi, eliminarEstudianteApi,
} from '../../services/estudianteService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const AREAS = ['Hematología', 'Inmunología', 'Microbiología', 'Parasitología', 'Bioquimica', 'Uroanálisis', 'Banco de Sangre','Toxicologicos','Examanes Especiales','Obsorción Atomica','Biologia Molecular', 'Tamizaje Neonatal','Administrativos','Otro'];

const generarPassword = (documento) => {
  const d = (documento || '').replace(/\D/g, '');
  return d ? `Up${d}!` : 'Bacterio2025!';
};

const OjoIcon = ({ visible }) => visible ? (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
) : (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

/* ─── Modal credenciales supervisor ─── */
const ModalCredencialesSupervisor = ({ credenciales, onCerrar }) => {
  const copiar = (texto) => { navigator.clipboard.writeText(texto); toast.success('Copiado'); };
  return (
    <Modal abierto={!!credenciales} onCerrar={onCerrar} titulo="✅ Docente creado y asociado">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          El docente fue creado y asociado a la entidad. Comparte estas credenciales.
        </p>
        <div className="bg-blue-50 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Docente supervisor</p>
            <p className="font-semibold text-gray-800">{credenciales?.nombre}</p>
          </div>
          {[
            { label: 'Correo electrónico', value: credenciales?.email },
            { label: 'Contraseña', value: credenciales?.password },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white rounded-lg px-3 py-2 text-sm text-gray-800 border break-all">{value}</code>
                <button onClick={() => copiar(value)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                  📋
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          ⚠️ Guarda estas credenciales ahora. El sistema no mostrará la contraseña de nuevo.
        </p>
        <Button className="w-full" onClick={onCerrar}>Entendido</Button>
      </div>
    </Modal>
  );
};

/* ─── Modal credenciales estudiante ─── */
const ModalCredencialesEstudiante = ({ credenciales, onCerrar }) => {
  const copiar = (texto) => { navigator.clipboard.writeText(texto); toast.success('Copiado al portapapeles'); };
  return (
    <Modal abierto={!!credenciales} onCerrar={onCerrar} titulo="✅ Estudiante creado exitosamente">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Comparte estas credenciales con el estudiante.</p>
        <div className="bg-blue-50 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Estudiante</p>
            <p className="font-semibold text-gray-800">{credenciales?.nombre}</p>
          </div>
          {[
            { label: 'Correo electrónico', value: credenciales?.email },
            { label: 'Contraseña', value: credenciales?.password },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white rounded-lg px-3 py-2 text-sm text-gray-800 border border-blue-100 break-all">{value}</code>
                <button onClick={() => copiar(value)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0">📋</button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          ⚠️ Guarda estas credenciales ahora. El sistema no mostrará la contraseña de nuevo.
        </p>
        <Button className="w-full" onClick={onCerrar}>Entendido</Button>
      </div>
    </Modal>
  );
};

/* ─── Modal crear supervisor ─── */
const ModalCrearSupervisor = ({ abierto, onCerrar, onCreado }) => {
  const [guardando, setGuardando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    defaultValues: { rol: 'docente' },
  });
  const documento = useWatch({ control, name: 'documento', defaultValue: '' });

  useEffect(() => { setValue('password', generarPassword(documento)); }, [documento, setValue]);

  const cerrar = () => { onCerrar(); reset({ rol: 'docente' }); setVerPassword(false); };

  const onSubmit = async ({ documento: _doc, ...datos }) => {
    setGuardando(true);
    try {
      await onCreado(datos);
      cerrar();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={abierto} onCerrar={cerrar} titulo="Crear docente supervisor" ancho="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" value="docente" {...register('rol')} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre *" error={errors.nombre?.message}
            {...register('nombre', { required: 'Requerido' })} />
          <Input label="Apellido *" error={errors.apellido?.message}
            {...register('apellido', { required: 'Requerido' })} />
        </div>

        <Input label="Número de documento" {...register('documento')} />

        <Input label="Correo electrónico *" type="email" error={errors.email?.message}
          {...register('email', {
            required: 'Requerido',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' },
          })} />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Contraseña (auto-generada)</label>
            <button type="button" onClick={() => setValue('password', generarPassword(documento))}
              className="text-xs text-up-blue hover:underline">🔄 Regenerar</button>
          </div>
          <div className="relative">
            <input
              type={verPassword ? 'text' : 'password'}
              className={`input-field font-mono pr-20 ${errors.password ? 'input-error' : ''}`}
              {...register('password', { required: 'Requerida', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button type="button"
                onClick={() => {
                  const el = document.querySelector('input[name="password"]');
                  if (el) { navigator.clipboard.writeText(el.value); toast.success('Contraseña copiada'); }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button type="button" onClick={() => setVerPassword((v) => !v)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                <OjoIcon visible={verPassword} />
              </button>
            </div>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          <p className="text-xs text-gray-400 mt-1">Generada a partir del documento. Puedes editarla.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={cerrar}>Cancelar</Button>
          <Button type="submit" loading={guardando} className="flex-1">Crear docente y asociar</Button>
        </div>
      </form>
    </Modal>
  );
};

/* ─── Modal asociar supervisor existente ─── */
const ModalAsociarExistente = ({ abierto, onCerrar, idsActuales, onAsociado }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [asociando, setAsociando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    listarUsuariosApi({ rol: 'docente' })
    .then((resDoc) => {
      setUsuarios(resDoc.data.data.filter((u) => !idsActuales.has(u.id) && u.activo));
      setSeleccionado('');
    }).catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setCargando(false));
  }, [abierto]);

  const handleAsociar = async () => {
    if (!seleccionado) return;
    setAsociando(true);
    try {
      await onAsociado(seleccionado);
      onCerrar();
    } finally {
      setAsociando(false);
    }
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Asociar docente existente">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Selecciona un docente ya registrado en el sistema.
        </p>
        {cargando ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-up-blue border-t-transparent" />
          </div>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
            No hay docentes disponibles para asociar. Todos ya están en esta entidad o no existen aún.
          </p>
        ) : (
          <div>
            <label className="label">Supervisor</label>
            <select className="input-field" value={seleccionado} onChange={(e) => setSeleccionado(e.target.value)}>
              <option value="">Seleccionar...</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" loading={asociando} disabled={!seleccionado} onClick={handleAsociar}>Asociar</Button>
        </div>
      </div>
    </Modal>
  );
};

/* ─── Formulario estudiante (crear / editar) ─── */
const FormularioEstudiante = ({
  onSubmit, guardando, onCerrar, entidades, modoEdicion,
  register, handleSubmit, errors, control, setValue, verPassword, setVerPassword,
}) => {
  const documento = useWatch({ control, name: 'numeroDocumento', defaultValue: '' });

  useEffect(() => {
    if (!modoEdicion) setValue('password', generarPassword(documento));
  }, [documento, setValue, modoEdicion]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nombre *" error={errors.nombre?.message}
          {...register('nombre', { required: 'Requerido' })} />
        <Input label="Apellido *" error={errors.apellido?.message}
          {...register('apellido', { required: 'Requerido' })} />
      </div>

      {!modoEdicion && (
        <Input label="Número de documento *" error={errors.numeroDocumento?.message}
          {...register('numeroDocumento', { required: 'Requerido' })} />
      )}

      <div>
        <label className="label">Semestre *</label>
        <select className={`input-field ${errors.semestre ? 'input-error' : ''}`}
          {...register('semestre', { required: 'Requerido' })}>
          <option value="">Seleccionar semestre</option>
          <option value="noveno">Noveno semestre</option>
          <option value="decimo">Décimo semestre</option>
        </select>
        {errors.semestre && <p className="text-xs text-red-500 mt-1">{errors.semestre.message}</p>}
      </div>

      <div>
        <label className="label">Entidad de práctica</label>
        <select className="input-field" {...register('entidadId')}>
          <option value="">Sin asignar</option>
          {entidades.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}{e.ciudad ? ` — ${e.ciudad}` : ''}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Fecha inicio práctica" type="date" {...register('fechaInicio')} />
        <Input label="Fecha fin práctica" type="date" {...register('fechaFin')} />
      </div>

      {!modoEdicion && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Credenciales de acceso</p>
          <div className="space-y-3">
            <Input label="Correo electrónico *" type="email" error={errors.email?.message}
              {...register('email', {
                required: 'Requerido',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' },
              })} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Contraseña (auto-generada)</label>
                <button type="button"
                  onClick={() => setValue('password', generarPassword(documento))}
                  className="text-xs text-up-blue hover:underline">🔄 Regenerar</button>
              </div>
              <div className="relative">
                <input
                  type={verPassword ? 'text' : 'password'}
                  className={`input-field font-mono pr-20 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', {
                    required: 'Requerida',
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                  })}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button"
                    onClick={() => {
                      const el = document.querySelector('input[name="password"]');
                      if (el) { navigator.clipboard.writeText(el.value); toast.success('Contraseña copiada'); }
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => setVerPassword((v) => !v)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <OjoIcon visible={verPassword} />
                  </button>
                </div>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              <p className="text-xs text-gray-400 mt-1">Generada a partir del número de documento. Puedes editarla.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
        <Button type="submit" loading={guardando} className="flex-1">
          {modoEdicion ? 'Guardar cambios' : 'Crear estudiante'}
        </Button>
      </div>
    </form>
  );
};

/* ─── Tab bar ─── */
const TabBar = ({ tab, setTab, counts }) => {
  const tabs = [
    { id: 'examenes', label: 'Exámenes y Actividades', icon: '🧪', count: counts.examenes },
    { id: 'supervisores', label: 'Supervisores', icon: '👥', count: counts.supervisores },
    { id: 'estudiantes', label: 'Estudiantes', icon: '👨‍🎓', count: counts.estudiantes },
  ];
  return (
    <div className="flex gap-2 flex-wrap border-b border-gray-100 pb-0">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
            tab === t.id
              ? 'border-up-blue text-up-blue bg-blue-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>{t.icon}</span>
          {t.label}
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
            tab === t.id ? 'bg-up-blue/10 text-up-blue' : 'bg-gray-100 text-gray-500'
          }`}>
            {t.count}
          </span>
        </button>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════ */
const EntidadDetalle = () => {
  const { id } = useParams();
  const [tab, setTab] = useState('examenes');
  const [entidad, setEntidad] = useState(null);
  const [cargando, setCargando] = useState(true);

  /* ── Exámenes ── */
  const [modalExamen, setModalExamen] = useState(false);
  const [guardandoExamen, setGuardandoExamen] = useState(false);
  const formExamen = useForm();

  /* ── Importar exámenes ── */
  const [modalImportar, setModalImportar] = useState(false);
  const [importOrigenId, setImportOrigenId] = useState('');
  const [importExamenes, setImportExamenes] = useState([]);
  const [importCargando, setImportCargando] = useState(false);
  const [importSeleccionados, setImportSeleccionados] = useState(new Set());
  const [importando, setImportando] = useState(false);
  const [importBusqueda, setImportBusqueda] = useState('');

  /* ── Supervisores ── */
  const [modalCrearSupervisor, setModalCrearSupervisor] = useState(false);
  const [modalAsociar, setModalAsociar] = useState(false);
  const [credencialesSupervisor, setCredencialesSupervisor] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  /* ── Estudiantes ── */
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudiantesCargando, setEstudiantesCargando] = useState(false);
  const [estudiantesLoaded, setEstudiantesLoaded] = useState(false);
  const [entidades, setEntidades] = useState([]);
  const [modalCrearEst, setModalCrearEst] = useState(false);
  const [estudianteEditar, setEstudianteEditar] = useState(null);
  const [estudianteDesactivar, setEstudianteDesactivar] = useState(null);
  const [guardandoEst, setGuardandoEst] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [credencialesEst, setCredencialesEst] = useState(null);
  const [verPassword, setVerPassword] = useState(false);

  const formCrearEst = useForm();
  const formEditarEst = useForm();

  /* ── Cargar entidad ── */
  const cargar = async () => {
    try {
      const { data } = await obtenerEntidadApi(id);
      setEntidad(data.data);
    } catch {
      toast.error('Error al cargar la entidad');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [id]);

  /* ── Cargar estudiantes (lazy) ── */
  const cargarEstudiantes = useCallback(async () => {
    if (estudiantesLoaded) return;
    setEstudiantesCargando(true);
    try {
      const [resEst, resEnt] = await Promise.all([
        listarEstudiantesApi({ entidadId: id }),
        listarEntidadesApi({ activo: true }),
      ]);
      setEstudiantes(resEst.data.data);
      setEntidades(resEnt.data.data);
      setEstudiantesLoaded(true);
    } catch {
      toast.error('Error al cargar estudiantes');
    } finally {
      setEstudiantesCargando(false);
    }
  }, [id, estudiantesLoaded]);

  useEffect(() => {
    if (tab === 'estudiantes') cargarEstudiantes();
  }, [tab, cargarEstudiantes]);

  /* ── Handlers: Exámenes ── */
  const onSubmitExamen = async (datos) => {
    setGuardandoExamen(true);
    try {
      const { data } = await crearExamenApi(id, datos);
      setEntidad((prev) => ({ ...prev, examenes: [...prev.examenes, data.data] }));
      toast.success('Examen agregado');
      formExamen.reset();
      setModalExamen(false);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear examen');
    } finally {
      setGuardandoExamen(false);
    }
  };

  const toggleExamen = async (examen) => {
    try {
      await actualizarExamenApi(id, examen.id, { activo: !examen.activo });
      setEntidad((prev) => ({
        ...prev,
        examenes: prev.examenes.map((e) => e.id === examen.id ? { ...e, activo: !e.activo } : e),
      }));
    } catch {
      toast.error('Error al actualizar examen');
    }
  };

  /* ── Handlers: Importar exámenes ── */
  const abrirImportar = async () => {
    setImportOrigenId('');
    setImportExamenes([]);
    setImportSeleccionados(new Set());
    setImportBusqueda('');
    setModalImportar(true);
    if (entidades.length === 0) {
      try {
        const { data } = await listarEntidadesApi({ activo: true });
        setEntidades(data.data);
      } catch { /* silencioso, el select mostrará vacío */ }
    }
  };

  const cargarExamenesOrigen = async (origenId) => {
    setImportOrigenId(origenId);
    setImportExamenes([]);
    setImportSeleccionados(new Set());
    if (!origenId) return;
    setImportCargando(true);
    try {
      const { data } = await listarExamenesApi(origenId);
      const lista = data.data || [];
      setImportExamenes(lista);
      setImportSeleccionados(new Set(lista.map((e) => e.id)));
    } catch {
      toast.error('Error al cargar exámenes de la entidad');
    } finally {
      setImportCargando(false);
    }
  };

  const toggleImportExamen = (eid) => {
    setImportSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(eid)) next.delete(eid); else next.add(eid);
      return next;
    });
  };

  const toggleImportGrupo = (ids, activar) => {
    setImportSeleccionados((prev) => {
      const next = new Set(prev);
      ids.forEach((eid) => (activar ? next.add(eid) : next.delete(eid)));
      return next;
    });
  };

  const confirmarImportar = async () => {
    if (!importSeleccionados.size) { toast.error('Selecciona al menos un examen'); return; }
    setImportando(true);
    try {
      const { data } = await importarExamenesApi(id, {
        origenId: importOrigenId,
        examenIds: [...importSeleccionados],
      });
      const nuevos = data.data || [];
      if (nuevos.length > 0) {
        setEntidad((prev) => ({ ...prev, examenes: [...prev.examenes, ...nuevos] }));
      }
      toast.success(data.mensaje || `${nuevos.length} exámenes importados`);
      setModalImportar(false);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al importar exámenes');
    } finally {
      setImportando(false);
    }
  };

  /* ── Handlers: Supervisores ── */
  const handleCrearSupervisor = async (datos) => {
    try {
      const { data: resUsuario } = await crearUsuarioApi(datos);
      const nuevoUsuario = resUsuario.data;
      const { data: resPersonal } = await agregarPersonalEntidadApi(id, nuevoUsuario.id);
      setEntidad((prev) => ({ ...prev, personal: [...prev.personal, resPersonal.data] }));
      setCredencialesSupervisor({ nombre: `${datos.nombre} ${datos.apellido}`, email: datos.email, password: datos.password, rol: datos.rol });
      toast.success('Supervisor creado y asociado a la entidad');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear supervisor');
      throw err;
    }
  };

  const handleAsociarExistente = async (usuarioId) => {
    try {
      const { data } = await agregarPersonalEntidadApi(id, usuarioId);
      setEntidad((prev) => ({ ...prev, personal: [...prev.personal, data.data] }));
      toast.success('Supervisor asociado a la entidad');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al asociar supervisor');
      throw err;
    }
  };

  const onEliminarPersonal = async (usuarioId) => {
    setEliminandoId(usuarioId);
    try {
      await eliminarPersonalEntidadApi(id, usuarioId);
      setEntidad((prev) => ({ ...prev, personal: prev.personal.filter((p) => p.usuarioId !== usuarioId) }));
      toast.success('Supervisor desasociado');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al desasociar');
    } finally {
      setEliminandoId(null);
    }
  };

  /* ── Handlers: Estudiantes ── */
  const cerrarCrearEst = () => { setModalCrearEst(false); formCrearEst.reset(); setVerPassword(false); };
  const cerrarEditarEst = () => { setEstudianteEditar(null); formEditarEst.reset(); };

  const abrirEditarEst = (est) => {
    setEstudianteEditar(est);
    const fechaISO = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
    formEditarEst.reset({
      nombre: est.usuario.nombre,
      apellido: est.usuario.apellido,
      semestre: est.semestre,
      entidadId: est.entidadId || '',
      fechaInicio: fechaISO(est.fechaInicio),
      fechaFin: fechaISO(est.fechaFin),
    });
  };

  const onCrearEst = async (datos) => {
    setGuardandoEst(true);
    try {
      const { data } = await crearEstudianteApi({ ...datos, entidadId: datos.entidadId || undefined });
      setEstudiantes((prev) => [data.data, ...prev]);
      setEntidad((prev) => ({ ...prev, _count: { ...prev._count, estudiantes: prev._count.estudiantes + 1 } }));
      cerrarCrearEst();
      setCredencialesEst({ nombre: `${datos.nombre} ${datos.apellido}`, email: datos.email, password: datos.password });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear estudiante');
    } finally {
      setGuardandoEst(false);
    }
  };

  const onEditarEst = async (datos) => {
    setGuardandoEst(true);
    try {
      const { data } = await actualizarEstudianteApi(estudianteEditar.id, {
        nombre: datos.nombre,
        apellido: datos.apellido,
        semestre: datos.semestre,
        entidadId: datos.entidadId || null,
        fechaInicio: datos.fechaInicio || null,
        fechaFin: datos.fechaFin || null,
      });
      setEstudiantes((prev) => prev.map((e) => e.id === estudianteEditar.id ? data.data : e));
      cerrarEditarEst();
      toast.success('Estudiante actualizado');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al actualizar');
    } finally {
      setGuardandoEst(false);
    }
  };

  const onDesactivarEst = async () => {
    setDesactivando(true);
    try {
      await eliminarEstudianteApi(estudianteDesactivar.id);
      setEstudiantes((prev) =>
        prev.map((e) => e.id === estudianteDesactivar.id
          ? { ...e, usuario: { ...e.usuario, activo: false } }
          : e)
      );
      setEstudianteDesactivar(null);
      toast.success('Estudiante desactivado');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al desactivar');
    } finally {
      setDesactivando(false);
    }
  };

  /* ── Loading / not found ── */
  if (cargando) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
    </div>
  );
  if (!entidad) return <p className="text-gray-500">Entidad no encontrada</p>;

  const areaGroups = entidad.examenes.reduce((acc, ex) => {
    const area = ex.area || 'Sin área';
    if (!acc[area]) acc[area] = [];
    acc[area].push(ex);
    return acc;
  }, {});

  const docentes = entidad.personal.filter((p) => p.usuario.rol === 'docente');
  const idsActuales = new Set(entidad.personal.map((p) => p.usuarioId));

  const propsFormEst = { entidades, verPassword, setVerPassword };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/entidades" className="text-gray-400 hover:text-gray-600 text-sm">← Entidades</Link>
      </div>

      {/* Info de la entidad */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{entidad.nombre}</h2>
            {entidad.direccion && <p className="text-gray-500 text-sm mt-1">{entidad.direccion}</p>}
            {entidad.ciudad && (
              <p className="text-gray-500 text-sm">{entidad.ciudad}{entidad.departamento ? `, ${entidad.departamento}` : ''}</p>
            )}
          </div>
          <span className={entidad.activo ? 'badge badge-green' : 'badge badge-gray'}>
            {entidad.activo ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <span>👨‍🎓 {entidad._count.estudiantes} estudiantes</span>
          <span>🧪 {entidad.examenes.length} exámenes y actividades</span>
          <span>👥 {entidad.personal.length} docentes</span>
        </div>
      </div>

      {/* Tabs */}
      <TabBar
        tab={tab}
        setTab={setTab}
        counts={{
          examenes: entidad.examenes.length,
          supervisores: entidad.personal.length,
          estudiantes: entidad._count.estudiantes,
        }}
      />

      {/* ════ TAB: EXÁMENES ════ */}
      {tab === 'examenes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Exámenes y Actividades</h3>
              <p className="text-sm text-gray-400 mt-0.5">Los estudiantes registran la cantidad diaria de cada examen o actividad.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={abrirImportar}>⬆️ Importar de otra entidad</Button>
              <Button onClick={() => setModalExamen(true)}>+ Agregar examen o actividad</Button>
            </div>
          </div>

          {entidad.examenes.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <span className="text-4xl">🧪</span>
              <p className="mt-2 text-sm">No hay exámenes registrados para esta entidad</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Examen</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Área</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {entidad.examenes.map((ex) => (
                      <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                        <td className={`px-4 py-3 font-medium ${ex.activo ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                          {ex.nombre}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {ex.area || <span className="italic text-gray-300">Sin área</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleExamen(ex)}
                            className={`text-xs px-2 py-1 rounded-full transition-colors ${
                              ex.activo
                                ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                                : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                            }`}
                          >
                            {ex.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Modal abierto={modalExamen} onCerrar={() => { setModalExamen(false); formExamen.reset(); }} titulo="Agregar examen o actividad">
            <form onSubmit={formExamen.handleSubmit(onSubmitExamen)} className="space-y-4">
              <div>
                <label className="label">Categoría / Área</label>
                <select className="input-field" {...formExamen.register('area')}>
                  <option value="">Seleccionar categoría</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Selecciona <span className="font-medium">Administrativos</span> para registrar actividades no clínicas.
                </p>
              </div>
              <Input label="Nombre del examen o actividad *" error={formExamen.formState.errors.nombre?.message}
                {...formExamen.register('nombre', { required: 'Requerido' })} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1"
                  onClick={() => { setModalExamen(false); formExamen.reset(); }}>
                  Cancelar
                </Button>
                <Button type="submit" loading={guardandoExamen} className="flex-1">Crear examen o actividad</Button>
              </div>
            </form>
          </Modal>

          {/* Modal importar exámenes */}
          <Modal
            abierto={modalImportar}
            onCerrar={() => setModalImportar(false)}
            titulo="Importar exámenes de otra entidad"
          >
            <div className="space-y-4">
              <div>
                <label className="label">Entidad origen</label>
                <select
                  className="input-field"
                  value={importOrigenId}
                  onChange={(e) => cargarExamenesOrigen(e.target.value)}
                >
                  <option value="">Seleccionar entidad...</option>
                  {entidades
                    .filter((e) => e.id !== id)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}{e.ciudad ? ` — ${e.ciudad}` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {importCargando && (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
                </div>
              )}

              {!importCargando && importOrigenId && importExamenes.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Esta entidad no tiene exámenes registrados.</p>
              )}

              {!importCargando && importExamenes.length > 0 && (() => {
                const filtrados = importExamenes.filter((e) =>
                  e.nombre.toLowerCase().includes(importBusqueda.toLowerCase())
                );
                const porArea = filtrados.reduce((acc, e) => {
                  const area = e.area || 'Sin área';
                  if (!acc[area]) acc[area] = [];
                  acc[area].push(e);
                  return acc;
                }, {});

                return (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={importBusqueda}
                      onChange={(e) => setImportBusqueda(e.target.value)}
                      placeholder="Buscar examen..."
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 px-1">
                      {importSeleccionados.size} de {importExamenes.length} seleccionados
                    </p>
                    <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                      {Object.entries(porArea).sort(([a], [b]) => a.localeCompare(b)).map(([area, exams]) => {
                        const ids = exams.map((e) => e.id);
                        const todosOn = ids.every((eid) => importSeleccionados.has(eid));
                        return (
                          <div key={area}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {area} ({exams.length})
                              </span>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => toggleImportGrupo(ids, true)} className="text-xs text-up-blue hover:underline">todos</button>
                                <span className="text-gray-300">·</span>
                                <button type="button" onClick={() => toggleImportGrupo(ids, false)} className="text-xs text-gray-400 hover:underline">ninguno</button>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                              {exams.map((ex) => (
                                <label key={ex.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors first:rounded-t-xl last:rounded-b-xl">
                                  <input
                                    type="checkbox"
                                    checked={importSeleccionados.has(ex.id)}
                                    onChange={() => toggleImportExamen(ex.id)}
                                    className="w-4 h-4 accent-up-blue flex-shrink-0"
                                  />
                                  <span className="text-sm text-gray-700">{ex.nombre}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 px-1">
                      Los exámenes que ya existen en esta entidad (mismo nombre y área) serán omitidos automáticamente.
                    </p>
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalImportar(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  loading={importando}
                  disabled={!importOrigenId || importSeleccionados.size === 0 || importCargando}
                  onClick={confirmarImportar}
                >
                  Importar {importSeleccionados.size > 0 ? `(${importSeleccionados.size})` : ''}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ════ TAB: SUPERVISORES ════ */}
      {tab === 'supervisores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Docentes supervisores</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Los estudiantes seleccionan al docente de guardia al crear cada registro diario.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setModalAsociar(true)}>Asociar existente</Button>
              <Button onClick={() => setModalCrearSupervisor(true)}>+ Crear docente</Button>
            </div>
          </div>

          {entidad.personal.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <span className="text-4xl">👥</span>
              <p className="mt-2 text-sm">No hay docentes asociados a esta entidad</p>
              <p className="text-xs mt-1">Crea un nuevo docente o asocia uno existente</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Correo</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {entidad.personal.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {p.usuario.nombre} {p.usuario.apellido}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.usuario.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Docente</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onEliminarPersonal(p.usuarioId)}
                            disabled={eliminandoId === p.usuarioId}
                            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
                          >
                            {eliminandoId === p.usuarioId ? '...' : 'Quitar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <ModalCrearSupervisor
            abierto={modalCrearSupervisor}
            onCerrar={() => setModalCrearSupervisor(false)}
            onCreado={handleCrearSupervisor}
          />
          <ModalAsociarExistente
            abierto={modalAsociar}
            onCerrar={() => setModalAsociar(false)}
            idsActuales={idsActuales}
            onAsociado={handleAsociarExistente}
          />
          <ModalCredencialesSupervisor credenciales={credencialesSupervisor} onCerrar={() => setCredencialesSupervisor(null)} />
        </div>
      )}

      {/* ════ TAB: ESTUDIANTES ════ */}
      {tab === 'estudiantes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Estudiantes en esta entidad</h3>
              <p className="text-sm text-gray-400 mt-0.5">Estudiantes asignados a {entidad.nombre} en el semestre activo.</p>
            </div>
            <Button onClick={() => {
              formCrearEst.reset({ entidadId: id });
              setModalCrearEst(true);
            }}>+ Nuevo estudiante</Button>
          </div>

          {estudiantesCargando ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
            </div>
          ) : estudiantes.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <span className="text-4xl">👨‍🎓</span>
              <p className="mt-2 text-sm font-medium text-gray-500">No hay estudiantes asignados a esta entidad</p>
              <p className="text-xs mt-1">Crea un estudiante nuevo o reasigna uno desde el panel de estudiantes</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Estudiante</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Documento</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Semestre</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {estudiantes.map((est) => (
                      <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{est.usuario.nombre} {est.usuario.apellido}</p>
                          <p className="text-xs text-gray-400">{est.usuario.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{est.numeroDocumento}</td>
                        <td className="px-4 py-3 capitalize">
                          <span className="badge badge-blue">{est.semestre}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={est.usuario.activo ? 'badge badge-green' : 'badge badge-gray'}>
                            {est.usuario.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => abrirEditarEst(est)}
                              className="p-1.5 text-gray-400 hover:text-up-blue hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {est.usuario.activo && (
                              <button
                                onClick={() => setEstudianteDesactivar(est)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Desactivar">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal crear estudiante */}
          <Modal abierto={modalCrearEst} onCerrar={cerrarCrearEst} titulo="Registrar nuevo estudiante" ancho="max-w-2xl">
            <FormularioEstudiante
              {...propsFormEst}
              modoEdicion={false}
              guardando={guardandoEst}
              onCerrar={cerrarCrearEst}
              onSubmit={onCrearEst}
              register={formCrearEst.register}
              handleSubmit={formCrearEst.handleSubmit}
              errors={formCrearEst.formState.errors}
              control={formCrearEst.control}
              setValue={formCrearEst.setValue}
            />
          </Modal>

          {/* Modal editar estudiante */}
          <Modal abierto={!!estudianteEditar} onCerrar={cerrarEditarEst} titulo="Editar estudiante" ancho="max-w-2xl">
            <FormularioEstudiante
              {...propsFormEst}
              modoEdicion={true}
              guardando={guardandoEst}
              onCerrar={cerrarEditarEst}
              onSubmit={onEditarEst}
              register={formEditarEst.register}
              handleSubmit={formEditarEst.handleSubmit}
              errors={formEditarEst.formState.errors}
              control={formEditarEst.control}
              setValue={formEditarEst.setValue}
            />
          </Modal>

          {/* Modal confirmar desactivar */}
          <Modal abierto={!!estudianteDesactivar} onCerrar={() => setEstudianteDesactivar(null)} titulo="Desactivar estudiante">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                ¿Estás seguro que deseas desactivar a{' '}
                <span className="font-semibold text-gray-800">
                  {estudianteDesactivar?.usuario?.nombre} {estudianteDesactivar?.usuario?.apellido}
                </span>?
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                ⚠️ El estudiante perderá acceso al sistema. Sus registros se conservarán.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1"
                  onClick={() => setEstudianteDesactivar(null)}>
                  Cancelar
                </Button>
                <button
                  onClick={onDesactivarEst}
                  disabled={desactivando}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {desactivando ? 'Desactivando...' : 'Sí, desactivar'}
                </button>
              </div>
            </div>
          </Modal>

          <ModalCredencialesEstudiante credenciales={credencialesEst} onCerrar={() => setCredencialesEst(null)} />
        </div>
      )}
    </div>
  );
};

export default EntidadDetalle;
