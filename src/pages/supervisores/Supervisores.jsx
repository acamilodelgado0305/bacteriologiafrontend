import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  listarUsuariosApi, crearUsuarioApi,
  actualizarUsuarioApi, cambiarPasswordApi, entidadesDeUsuarioApi,
} from '../../services/userService';
import {
  listarEntidadesApi, agregarPersonalEntidadApi, eliminarPersonalEntidadApi,
} from '../../services/entidadService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

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

const TABS = [
  { id: 'docente',      label: 'Docentes',     icon: '👩‍🏫' },
  { id: 'bacteriologo', label: 'Bacteriólogos', icon: '🔬' },
];

/* ── Modal credenciales tras crear ── */
const ModalCredenciales = ({ credenciales, onCerrar }) => {
  const copiar = (t) => { navigator.clipboard.writeText(t); toast.success('Copiado'); };
  if (!credenciales) return null;
  const esDocente = credenciales.rol === 'docente';
  return (
    <Modal abierto onCerrar={onCerrar} titulo={`✅ ${esDocente ? 'Docente' : 'Bacteriólogo'} creado`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Comparte estas credenciales con el {esDocente ? 'docente supervisor' : 'bacteriólogo encargado'}.
        </p>
        <div className="bg-green-50 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">{esDocente ? 'Docente' : 'Bacteriólogo'}</p>
            <p className="font-semibold text-gray-800">{credenciales.nombre}</p>
          </div>
          {[{ label: 'Correo', value: credenciales.email }, { label: 'Contraseña', value: credenciales.password }].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white rounded-lg px-3 py-2 text-sm text-gray-800 border border-green-100 break-all">{value}</code>
                <button onClick={() => copiar(value)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg flex-shrink-0">📋</button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          ⚠️ Guarda estas credenciales. El sistema no mostrará la contraseña de nuevo.
        </p>
        <Button className="w-full" onClick={onCerrar}>Entendido</Button>
      </div>
    </Modal>
  );
};

/* ── Modal editar supervisor ── */
const ModalEditar = ({ usuario, onCerrar, onGuardado }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { nombre: usuario.nombre, apellido: usuario.apellido },
  });
  const [guardando, setGuardando] = useState(false);

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      const { data } = await actualizarUsuarioApi(usuario.id, datos);
      toast.success('Supervisor actualizado');
      onGuardado(data.data);
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al actualizar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Editar supervisor">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre *" error={errors.nombre?.message}
            {...register('nombre', { required: 'Requerido' })} />
          <Input label="Apellido *" error={errors.apellido?.message}
            {...register('apellido', { required: 'Requerido' })} />
        </div>
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-xs text-gray-500">Correo electrónico</p>
          <p className="text-sm font-medium text-gray-700">{usuario.email}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" loading={guardando} className="flex-1">Guardar cambios</Button>
        </div>
      </form>
    </Modal>
  );
};

/* ── Modal cambiar contraseña ── */
const ModalPassword = ({ usuario, onCerrar }) => {
  const [password, setPassword] = useState(generarPassword(''));
  const [ver, setVer] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (password.length < 8) { toast.error('Mínimo 8 caracteres'); return; }
    setGuardando(true);
    try {
      await cambiarPasswordApi(usuario.id, { password_nueva: password });
      toast.success('Contraseña actualizada');
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al cambiar contraseña');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Cambiar contraseña">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Nueva contraseña para <span className="font-medium">{usuario.nombre} {usuario.apellido}</span>
        </p>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Nueva contraseña</label>
            <button type="button" onClick={() => setPassword(generarPassword(''))}
              className="text-xs text-up-blue hover:underline">🔄 Generar</button>
          </div>
          <div className="relative">
            <input
              type={ver ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field font-mono pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(password); toast.success('Copiada'); }}
                className="p-1.5 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button type="button" onClick={() => setVer((v) => !v)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <OjoIcon visible={ver} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button loading={guardando} className="flex-1" onClick={handleGuardar}>Actualizar contraseña</Button>
        </div>
      </div>
    </Modal>
  );
};

/* ── Modal asociar entidades ── */
const ModalEntidades = ({ usuario, onCerrar }) => {
  const [todasEntidades, setTodasEntidades] = useState([]);
  const [asociadas, setAsociadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [accionando, setAccionando] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resEntidades, resAsociadas] = await Promise.all([
          listarEntidadesApi({ activo: true }),
          entidadesDeUsuarioApi(usuario.id),
        ]);
        setTodasEntidades(resEntidades.data.data);
        setAsociadas(resAsociadas.data.data.map((e) => e.id));
      } catch {
        toast.error('Error al cargar entidades');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [usuario.id]);

  const asociar = async (entidadId) => {
    setAccionando(entidadId);
    try {
      await agregarPersonalEntidadApi(entidadId, usuario.id);
      setAsociadas((prev) => [...prev, entidadId]);
      toast.success('Asociado a la entidad');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al asociar');
    } finally {
      setAccionando(null);
    }
  };

  const quitar = async (entidadId) => {
    setAccionando(entidadId);
    try {
      await eliminarPersonalEntidadApi(entidadId, usuario.id);
      setAsociadas((prev) => prev.filter((id) => id !== entidadId));
      toast.success('Asociación eliminada');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al quitar');
    } finally {
      setAccionando(null);
    }
  };

  const entidadesFiltradas = todasEntidades.filter((e) =>
    !busqueda.trim() ||
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.ciudad?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const esDocente = usuario.rol === 'docente';

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Entidades — ${usuario.nombre} ${usuario.apellido}`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Gestiona en qué entidades este {esDocente ? 'docente' : 'bacteriólogo'} puede supervisar prácticas.
        </p>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar entidad..."
          className="input-field"
        />

        {cargando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
          </div>
        ) : entidadesFiltradas.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">No hay entidades disponibles</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {entidadesFiltradas.map((e) => {
              const estaAsociado = asociadas.includes(e.id);
              const cargandoEste = accionando === e.id;
              return (
                <div key={e.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                  estaAsociado ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{e.nombre}</p>
                    {e.ciudad && <p className="text-xs text-gray-400">{e.ciudad}</p>}
                  </div>
                  {estaAsociado ? (
                    <button
                      type="button"
                      onClick={() => quitar(e.id)}
                      disabled={cargandoEste}
                      className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {cargandoEste ? '...' : '✕ Quitar'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => asociar(e.id)}
                      disabled={cargandoEste}
                      className="text-xs px-2.5 py-1 rounded-lg border border-up-blue text-up-blue hover:bg-blue-50 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {cargandoEste ? '...' : '+ Asociar'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 text-right">
          <Button onClick={onCerrar}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
};

/* ── Fila de tabla ── */
const FilaUsuario = ({ usuario, onActualizado }) => {
  const [modalEditar, setModalEditar] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);
  const [modalEntidades, setModalEntidades] = useState(false);
  const [toggling, setToggling] = useState(false);

  const toggleActivo = async () => {
    setToggling(true);
    try {
      const { data } = await actualizarUsuarioApi(usuario.id, { activo: !usuario.activo });
      toast.success(data.data.activo ? 'Supervisor activado' : 'Supervisor desactivado');
      onActualizado(data.data);
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <tr className={`hover:bg-gray-50 transition-colors ${!usuario.activo ? 'opacity-50' : ''}`}>
        <td className="px-4 py-3">
          <p className="font-medium text-gray-800">{usuario.nombre} {usuario.apellido}</p>
          <p className="text-xs text-gray-400">{usuario.email}</p>
        </td>
        <td className="px-4 py-3 text-gray-400 text-xs">
          {usuario.ultimoAcceso ? new Date(usuario.ultimoAcceso).toLocaleDateString('es-CO') : 'Nunca'}
        </td>
        <td className="px-4 py-3">
          <span className={usuario.activo ? 'badge badge-green' : 'badge badge-gray'}>
            {usuario.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalEditar(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
              ✏️ Editar
            </button>
            <button
              type="button"
              onClick={() => setModalPassword(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
              🔑 Contraseña
            </button>
            <button
              type="button"
              onClick={() => setModalEntidades(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              🏥 Entidades
            </button>
            <button
              type="button"
              onClick={toggleActivo}
              disabled={toggling}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                usuario.activo
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-green-200 text-green-600 hover:bg-green-50'
              }`}
            >
              {toggling ? '...' : usuario.activo ? '🚫 Desactivar' : '✅ Activar'}
            </button>
          </div>
        </td>
      </tr>

      {modalEditar && (
        <ModalEditar
          usuario={usuario}
          onCerrar={() => setModalEditar(false)}
          onGuardado={onActualizado}
        />
      )}
      {modalPassword && (
        <ModalPassword
          usuario={usuario}
          onCerrar={() => setModalPassword(false)}
        />
      )}
      {modalEntidades && (
        <ModalEntidades
          usuario={usuario}
          onCerrar={() => setModalEntidades(false)}
        />
      )}
    </>
  );
};

/* ── Tabla principal ── */
const TablaUsuarios = ({ usuarios, cargando, onActualizado, emptyIcon, emptyText }) => {
  if (cargando) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
      </div>
    );
  }
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl">{emptyIcon}</span>
        <p className="mt-3 text-sm font-medium text-gray-500">{emptyText}</p>
      </div>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-100">
        <tr>
          <th className="text-left px-4 py-3 font-medium text-gray-600">Supervisor</th>
          <th className="text-left px-4 py-3 font-medium text-gray-600">Último acceso</th>
          <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
          <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {usuarios.map((u) => (
          <FilaUsuario key={u.id} usuario={u} onActualizado={onActualizado} />
        ))}
      </tbody>
    </table>
  );
};

/* ── Página principal ── */
const Supervisores = () => {
  const [tab, setTab] = useState('docente');
  const [listas, setListas] = useState({ docente: [], bacteriologo: [] });
  const [cargando, setCargando] = useState({ docente: true, bacteriologo: true });
  const [modalCrear, setModalCrear] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [credencialesCreadas, setCredencialesCreadas] = useState(null);
  const [verPassword, setVerPassword] = useState(false);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    defaultValues: { rol: 'docente' },
  });
  const documento = useWatch({ control, name: 'documento', defaultValue: '' });
  const rolForm = useWatch({ control, name: 'rol', defaultValue: 'docente' });

  useEffect(() => { setValue('password', generarPassword(documento)); }, [documento, setValue]);

  const cargar = async (rol) => {
    setCargando((prev) => ({ ...prev, [rol]: true }));
    try {
      const { data } = await listarUsuariosApi({ rol });
      setListas((prev) => ({ ...prev, [rol]: data.data }));
    } catch {
      toast.error(`Error al cargar ${rol === 'docente' ? 'docentes' : 'bacteriólogos'}`);
    } finally {
      setCargando((prev) => ({ ...prev, [rol]: false }));
    }
  };

  useEffect(() => { cargar('docente'); cargar('bacteriologo'); }, []);

  const cerrarModalCrear = () => { setModalCrear(false); reset({ rol: 'docente' }); setVerPassword(false); };

  const onSubmit = async ({ documento: _doc, ...datos }) => {
    setGuardando(true);
    try {
      const { data } = await crearUsuarioApi(datos);
      setListas((prev) => ({ ...prev, [datos.rol]: [data.data, ...prev[datos.rol]] }));
      setTab(datos.rol);
      cerrarModalCrear();
      setCredencialesCreadas({ nombre: `${datos.nombre} ${datos.apellido}`, email: datos.email, password: datos.password, rol: datos.rol });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear supervisor');
    } finally {
      setGuardando(false);
    }
  };

  const handleActualizado = (usuarioActualizado) => {
    const rol = usuarioActualizado.rol;
    setListas((prev) => ({
      ...prev,
      [rol]: prev[rol].map((u) => u.id === usuarioActualizado.id ? usuarioActualizado : u),
    }));
  };

  const tabActual = TABS.find((t) => t.id === tab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Supervisores</h2>
          <p className="text-gray-500 text-sm mt-1">Docentes y bacteriólogos con acceso al sistema</p>
        </div>
        <Button onClick={() => setModalCrear(true)}>+ Nuevo supervisor</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              tab === t.id ? 'bg-up-blue text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            {t.icon} {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {listas[t.id].length}
            </span>
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <TablaUsuarios
          usuarios={listas[tab]}
          cargando={cargando[tab]}
          onActualizado={handleActualizado}
          emptyIcon={tabActual.icon}
          emptyText={`No hay ${tabActual.label.toLowerCase()} registrados`}
        />
      </div>

      {/* Modal crear */}
      <Modal abierto={modalCrear} onCerrar={cerrarModalCrear} titulo="Registrar nuevo supervisor">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {TABS.map((t) => (
              <label key={t.id} className={`flex items-center gap-2 border-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                rolForm === t.id ? 'border-up-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" value={t.id} {...register('rol')} className="sr-only" />
                <span>{t.icon}</span>
                <span className="text-sm font-medium text-gray-700">{t.label.slice(0, -1)}</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre *" error={errors.nombre?.message}
              {...register('nombre', { required: 'Requerido' })} />
            <Input label="Apellido *" error={errors.apellido?.message}
              {...register('apellido', { required: 'Requerido' })} />
          </div>
          <Input label="Número de documento" {...register('documento')} />
          <Input label="Correo electrónico *" type="email" error={errors.email?.message}
            {...register('email', { required: 'Requerido', pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' } })} />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Contraseña (auto-generada)</label>
              <button type="button" onClick={() => setValue('password', generarPassword(documento))}
                className="text-xs text-up-blue hover:underline">🔄 Regenerar</button>
            </div>
            <div className="relative">
              <input type={verPassword ? 'text' : 'password'}
                className={`input-field font-mono pr-20 ${errors.password ? 'input-error' : ''}`}
                {...register('password', { required: 'Requerida', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button type="button"
                  onClick={() => { const el = document.querySelector('input[name="password"]'); if (el) { navigator.clipboard.writeText(el.value); toast.success('Contraseña copiada'); } }}
                  className="p-1.5 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button type="button" onClick={() => setVerPassword((v) => !v)} className="p-1.5 text-gray-400 hover:text-gray-600">
                  <OjoIcon visible={verPassword} />
                </button>
              </div>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            <p className="text-xs text-gray-400 mt-1">Generada a partir del documento. Puedes editarla manualmente.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={cerrarModalCrear}>Cancelar</Button>
            <Button type="submit" loading={guardando} className="flex-1">
              Crear {rolForm === 'docente' ? 'docente' : 'bacteriólogo'}
            </Button>
          </div>
        </form>
      </Modal>

      <ModalCredenciales credenciales={credencialesCreadas} onCerrar={() => setCredencialesCreadas(null)} />
    </div>
  );
};

export default Supervisores;
