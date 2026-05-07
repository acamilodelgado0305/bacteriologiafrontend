import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  obtenerEntidadApi, crearExamenApi, actualizarExamenApi,
  agregarPersonalEntidadApi, eliminarPersonalEntidadApi,
} from '../../services/entidadService';
import { crearUsuarioApi, listarUsuariosApi } from '../../services/userService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const AREAS = ['Hematología', 'Inmunología', 'Microbiología', 'Parasitología', 'Química Clínica', 'Uroanálisis', 'Banco de Sangre', 'Otro'];

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

const ModalCredenciales = ({ credenciales, onCerrar }) => {
  const copiar = (texto) => { navigator.clipboard.writeText(texto); toast.success('Copiado'); };
  const color = credenciales?.rol === 'docente' ? 'blue' : 'purple';
  return (
    <Modal abierto={!!credenciales} onCerrar={onCerrar}
      titulo={`✅ ${credenciales?.rol === 'docente' ? 'Docente' : 'Bacteriólogo'} creado y asociado`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          El supervisor fue creado y asociado a la entidad. Comparte estas credenciales.
        </p>
        <div className={`bg-${color}-50 rounded-xl p-4 space-y-3`}>
          <div>
            <p className="text-xs text-gray-500 mb-1">Supervisor</p>
            <p className="font-semibold text-gray-800">{credenciales?.nombre}</p>
            <p className="text-xs text-gray-500 capitalize">{credenciales?.rol}</p>
          </div>
          {[
            { label: 'Correo electrónico', value: credenciales?.email },
            { label: 'Contraseña', value: credenciales?.password },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white rounded-lg px-3 py-2 text-sm text-gray-800 border break-all">
                  {value}
                </code>
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

// Modal para crear un nuevo supervisor (docente o bacteriólogo) y asociarlo a la entidad
const ModalCrearSupervisor = ({ abierto, onCerrar, onCreado }) => {
  const [guardando, setGuardando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    defaultValues: { rol: 'docente' },
  });
  const documento = useWatch({ control, name: 'documento', defaultValue: '' });
  const rol = useWatch({ control, name: 'rol', defaultValue: 'docente' });

  useEffect(() => {
    setValue('password', generarPassword(documento));
  }, [documento, setValue]);

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
    <Modal abierto={abierto} onCerrar={cerrar} titulo="Crear supervisor en esta entidad" ancho="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Rol */}
        <div>
          <label className="label">Rol *</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'docente', label: '👩‍🏫 Docente', color: 'blue' },
              { value: 'bacteriologo', label: '🔬 Bacteriólogo', color: 'purple' },
            ].map((op) => (
              <label key={op.value}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-colors ${
                  rol === op.value
                    ? op.color === 'blue'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                <input type="radio" value={op.value} {...register('rol')} className="sr-only" />
                <span className="text-sm font-medium">{op.label}</span>
              </label>
            ))}
          </div>
        </div>

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
              className="text-xs text-up-blue hover:underline">
              🔄 Regenerar
            </button>
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
          <p className="text-xs text-gray-400 mt-1">Generada a partir del documento. Puedes editarla.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={cerrar}>Cancelar</Button>
          <Button type="submit" loading={guardando} className="flex-1">
            Crear y asociar
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal para asociar un supervisor ya existente en el sistema
const ModalAsociarExistente = ({ abierto, onCerrar, idsActuales, onAsociado }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [asociando, setAsociando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    Promise.all([
      listarUsuariosApi({ rol: 'docente' }),
      listarUsuariosApi({ rol: 'bacteriologo' }),
    ]).then(([resDoc, resBac]) => {
      const todos = [...resDoc.data.data, ...resBac.data.data];
      setUsuarios(todos.filter((u) => !idsActuales.has(u.id) && u.activo));
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
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Asociar supervisor existente">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Selecciona un docente o bacteriólogo ya registrado en el sistema.
        </p>
        {cargando ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-up-blue border-t-transparent" />
          </div>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
            No hay supervisores disponibles para asociar. Todos ya están en esta entidad o no existen aún.
          </p>
        ) : (
          <div>
            <label className="label">Supervisor</label>
            <select className="input-field" value={seleccionado} onChange={(e) => setSeleccionado(e.target.value)}>
              <option value="">Seleccionar...</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido} — {u.rol === 'docente' ? 'Docente' : 'Bacteriólogo'}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" loading={asociando} disabled={!seleccionado} onClick={handleAsociar}>
            Asociar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const EntidadDetalle = () => {
  const { id } = useParams();
  const [entidad, setEntidad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalExamen, setModalExamen] = useState(false);
  const [modalCrearSupervisor, setModalCrearSupervisor] = useState(false);
  const [modalAsociar, setModalAsociar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [credenciales, setCredenciales] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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

  // Crear nuevo supervisor y asociarlo automáticamente
  const handleCrearSupervisor = async (datos) => {
    try {
      const { data: resUsuario } = await crearUsuarioApi(datos);
      const nuevoUsuario = resUsuario.data;
      const { data: resPersonal } = await agregarPersonalEntidadApi(id, nuevoUsuario.id);
      setEntidad((prev) => ({ ...prev, personal: [...prev.personal, resPersonal.data] }));
      setCredenciales({
        nombre: `${datos.nombre} ${datos.apellido}`,
        email: datos.email,
        password: datos.password,
        rol: datos.rol,
      });
      toast.success('Supervisor creado y asociado a la entidad');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear supervisor');
      throw err;
    }
  };

  // Asociar supervisor ya existente
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

  const onSubmitExamen = async (datos) => {
    setGuardando(true);
    try {
      const { data } = await crearExamenApi(id, datos);
      setEntidad((prev) => ({ ...prev, examenes: [...prev.examenes, data.data] }));
      toast.success('Examen agregado');
      reset();
      setModalExamen(false);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear examen');
    } finally {
      setGuardando(false);
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
  const bacteriologos = entidad.personal.filter((p) => p.usuario.rol === 'bacteriologo');
  const idsActuales = new Set(entidad.personal.map((p) => p.usuarioId));

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
          <span>🧪 {entidad.examenes.length} exámenes</span>
          <span>👥 {entidad.personal.length} supervisores</span>
        </div>
      </div>

      {/* Personal supervisor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Personal supervisor</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Los estudiantes seleccionan al supervisor de guardia al crear cada registro diario.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setModalAsociar(true)}>
              Asociar existente
            </Button>
            <Button onClick={() => setModalCrearSupervisor(true)}>
              + Crear supervisor
            </Button>
          </div>
        </div>

        {entidad.personal.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <span className="text-4xl">👥</span>
            <p className="mt-2 text-sm">No hay supervisores asociados a esta entidad</p>
            <p className="text-xs mt-1">Crea un nuevo supervisor o asocia uno existente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {docentes.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
                  <span className="text-sm font-semibold text-blue-700">Docentes ({docentes.length})</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {docentes.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.usuario.nombre} {p.usuario.apellido}</p>
                        <p className="text-xs text-gray-400">{p.usuario.email}</p>
                      </div>
                      <button
                        onClick={() => onEliminarPersonal(p.usuarioId)}
                        disabled={eliminandoId === p.usuarioId}
                        className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {eliminandoId === p.usuarioId ? '...' : 'Quitar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bacteriologos.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="bg-purple-50 px-4 py-2 border-b border-purple-100">
                  <span className="text-sm font-semibold text-purple-700">Bacteriólogos ({bacteriologos.length})</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {bacteriologos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.usuario.nombre} {p.usuario.apellido}</p>
                        <p className="text-xs text-gray-400">{p.usuario.email}</p>
                      </div>
                      <button
                        onClick={() => onEliminarPersonal(p.usuarioId)}
                        disabled={eliminandoId === p.usuarioId}
                        className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {eliminandoId === p.usuarioId ? '...' : 'Quitar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exámenes */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Exámenes disponibles</h3>
        <Button onClick={() => setModalExamen(true)}>+ Agregar examen</Button>
      </div>

      {entidad.examenes.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <span className="text-4xl">🧪</span>
          <p className="mt-2 text-sm">No hay exámenes registrados para esta entidad</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(areaGroups).map(([area, examenes]) => (
            <div key={area} className="card p-0 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-600">{area}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {examenes.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between px-4 py-3">
                    <span className={`text-sm ${ex.activo ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                      {ex.nombre}
                    </span>
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
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

      <ModalCredenciales credenciales={credenciales} onCerrar={() => setCredenciales(null)} />

      <Modal abierto={modalExamen} onCerrar={() => { setModalExamen(false); reset(); }} titulo="Agregar examen">
        <form onSubmit={handleSubmit(onSubmitExamen)} className="space-y-4">
          <Input label="Nombre del examen *" error={errors.nombre?.message}
            {...register('nombre', { required: 'Requerido' })} />
          <div>
            <label className="label">Área</label>
            <select className="input-field" {...register('area')}>
              <option value="">Seleccionar área</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1"
              onClick={() => { setModalExamen(false); reset(); }}>
              Cancelar
            </Button>
            <Button type="submit" loading={guardando} className="flex-1">Agregar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EntidadDetalle;
