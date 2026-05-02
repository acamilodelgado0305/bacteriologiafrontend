import { useEffect, useState, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { listarEstudiantesApi, crearEstudianteApi, actualizarEstudianteApi, eliminarEstudianteApi } from '../../services/estudianteService';
import { listarEntidadesApi } from '../../services/entidadService';
import { listarUsuariosApi } from '../../services/userService';
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

const ModalCredenciales = ({ credenciales, onCerrar }) => {
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

const ModalConfirmar = ({ abierto, estudiante, onConfirmar, onCerrar, cargando }) => (
  <Modal abierto={abierto} onCerrar={onCerrar} titulo="Desactivar estudiante">
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        ¿Estás seguro que deseas desactivar a{' '}
        <span className="font-semibold text-gray-800">
          {estudiante?.usuario?.nombre} {estudiante?.usuario?.apellido}
        </span>?
      </p>
      <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
        ⚠️ El estudiante perderá acceso al sistema. Sus registros se conservarán.
      </p>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
        <button
          onClick={onConfirmar}
          disabled={cargando}
          className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {cargando ? 'Desactivando...' : 'Sí, desactivar'}
        </button>
      </div>
    </div>
  </Modal>
);

// Formulario compartido por crear y editar
const FormularioEstudiante = ({ onSubmit, guardando, onCerrar, entidades, docentes, bacteriologos, modoEdicion, register, handleSubmit, errors, control, setValue, verPassword, setVerPassword }) => {
  const documento = useWatch({ control, name: 'numeroDocumento', defaultValue: '' });

  useEffect(() => {
    if (!modoEdicion) setValue('password', generarPassword(documento));
  }, [documento, setValue, modoEdicion]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nombre *" placeholder="Andrés"
          error={errors.nombre?.message}
          {...register('nombre', { required: 'Requerido' })} />
        <Input label="Apellido *" placeholder="Delgado"
          error={errors.apellido?.message}
          {...register('apellido', { required: 'Requerido' })} />
      </div>

      {!modoEdicion && (
        <Input label="Número de documento *" placeholder="1090123456"
          error={errors.numeroDocumento?.message}
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
        <div>
          <label className="label">Docente supervisor</label>
          <select className="input-field" {...register('docenteSupervisorId')}>
            <option value="">Sin asignar</option>
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Bacteriólogo supervisor</label>
          <select className="input-field" {...register('bacteriologoSupervisorId')}>
            <option value="">Sin asignar</option>
            {bacteriologos.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre} {b.apellido}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Fecha inicio práctica" type="date" {...register('fechaInicio')} />
        <Input label="Fecha fin práctica" type="date" {...register('fechaFin')} />
      </div>

      {!modoEdicion && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Credenciales de acceso</p>
          <div className="space-y-3">
            <Input label="Correo electrónico *" type="email" placeholder="estudiante@correo.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Requerido',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' },
              })} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Contraseña (auto-generada)</label>
                <button type="button"
                  onClick={() => setValue('password', generarPassword(documento))}
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

const Estudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [bacteriologos, setBacteriologos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [estudianteEditar, setEstudianteEditar] = useState(null);
  const [estudianteEliminar, setEstudianteEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [credencialesCreadas, setCredencialesCreadas] = useState(null);
  const [verPassword, setVerPassword] = useState(false);

  const formCrear = useForm();
  const formEditar = useForm();

  const cargar = async () => {
    try {
      const [resEst, resEnt, resDoc, resBac] = await Promise.all([
        listarEstudiantesApi(),
        listarEntidadesApi({ activo: true }),
        listarUsuariosApi({ rol: 'docente' }),
        listarUsuariosApi({ rol: 'bacteriologo' }),
      ]);
      setEstudiantes(resEst.data.data);
      setEntidades(resEnt.data.data);
      setDocentes(resDoc.data.data);
      setBacteriologos(resBac.data.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirEditar = (est) => {
    setEstudianteEditar(est);
    const fechaISO = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
    formEditar.reset({
      nombre: est.usuario.nombre,
      apellido: est.usuario.apellido,
      semestre: est.semestre,
      entidadId: est.entidadId || '',
      docenteSupervisorId: est.docenteSupervisorId || '',
      bacteriologoSupervisorId: est.bacteriologoSupervisorId || '',
      fechaInicio: fechaISO(est.fechaInicio),
      fechaFin: fechaISO(est.fechaFin),
    });
  };

  const cerrarCrear = () => { setModalCrear(false); formCrear.reset(); setVerPassword(false); };
  const cerrarEditar = () => { setEstudianteEditar(null); formEditar.reset(); };

  const onCrear = async (datos) => {
    setGuardando(true);
    try {
      const { data } = await crearEstudianteApi({
        ...datos,
        entidadId: datos.entidadId || undefined,
        docenteSupervisorId: datos.docenteSupervisorId || undefined,
        bacteriologoSupervisorId: datos.bacteriologoSupervisorId || undefined,
      });
      setEstudiantes((prev) => [data.data, ...prev]);
      cerrarCrear();
      setCredencialesCreadas({
        nombre: `${datos.nombre} ${datos.apellido}`,
        email: datos.email,
        password: datos.password,
      });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear estudiante');
    } finally {
      setGuardando(false);
    }
  };

  const onEditar = async (datos) => {
    setGuardando(true);
    try {
      const { data } = await actualizarEstudianteApi(estudianteEditar.id, {
        nombre: datos.nombre,
        apellido: datos.apellido,
        semestre: datos.semestre,
        entidadId: datos.entidadId || null,
        docenteSupervisorId: datos.docenteSupervisorId || null,
        bacteriologoSupervisorId: datos.bacteriologoSupervisorId || null,
        fechaInicio: datos.fechaInicio || null,
        fechaFin: datos.fechaFin || null,
      });
      setEstudiantes((prev) => prev.map((e) => e.id === estudianteEditar.id ? data.data : e));
      cerrarEditar();
      toast.success('Estudiante actualizado');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al actualizar');
    } finally {
      setGuardando(false);
    }
  };

  const onEliminar = async () => {
    setEliminando(true);
    try {
      await eliminarEstudianteApi(estudianteEliminar.id);
      setEstudiantes((prev) => prev.map((e) =>
        e.id === estudianteEliminar.id
          ? { ...e, usuario: { ...e.usuario, activo: false } }
          : e
      ));
      setEstudianteEliminar(null);
      toast.success('Estudiante desactivado');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al desactivar');
    } finally {
      setEliminando(false);
    }
  };

  const propsForm = { entidades, docentes, bacteriologos, verPassword, setVerPassword };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Estudiantes en práctica</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión de estudiantes y sus asignaciones</p>
        </div>
        <Button onClick={() => setModalCrear(true)}>+ Nuevo estudiante</Button>
      </div>

      <div className="card p-0 overflow-hidden">
        {cargando ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
          </div>
        ) : estudiantes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-5xl">👨‍🎓</span>
            <p className="mt-3 text-sm font-medium text-gray-500">No hay estudiantes registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estudiante</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Documento</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Semestre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entidad</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Supervisores</th>
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
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {est.entidad?.nombre || <span className="text-gray-400 italic">Sin asignar</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 space-y-0.5">
                      <p>
                        <span className="text-gray-400">Doc: </span>
                        {est.docenteSupervisor
                          ? `${est.docenteSupervisor.nombre} ${est.docenteSupervisor.apellido}`
                          : <span className="italic text-gray-300">Sin asignar</span>}
                      </p>
                      <p>
                        <span className="text-gray-400">Bact: </span>
                        {est.bacteriologoSupervisor
                          ? `${est.bacteriologoSupervisor.nombre} ${est.bacteriologoSupervisor.apellido}`
                          : <span className="italic text-gray-300">Sin asignar</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={est.usuario.activo ? 'badge badge-green' : 'badge badge-gray'}>
                        {est.usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => abrirEditar(est)}
                          className="p-1.5 text-gray-400 hover:text-up-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {est.usuario.activo && (
                          <button
                            onClick={() => setEstudianteEliminar(est)}
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
        )}
      </div>

      {/* Modal crear */}
      <Modal abierto={modalCrear} onCerrar={cerrarCrear} titulo="Registrar nuevo estudiante" ancho="max-w-2xl">
        <FormularioEstudiante
          {...propsForm}
          modoEdicion={false}
          guardando={guardando}
          onCerrar={cerrarCrear}
          onSubmit={onCrear}
          register={formCrear.register}
          handleSubmit={formCrear.handleSubmit}
          errors={formCrear.formState.errors}
          control={formCrear.control}
          setValue={formCrear.setValue}
        />
      </Modal>

      {/* Modal editar */}
      <Modal abierto={!!estudianteEditar} onCerrar={cerrarEditar} titulo="Editar estudiante" ancho="max-w-2xl">
        <FormularioEstudiante
          {...propsForm}
          modoEdicion={true}
          guardando={guardando}
          onCerrar={cerrarEditar}
          onSubmit={onEditar}
          register={formEditar.register}
          handleSubmit={formEditar.handleSubmit}
          errors={formEditar.formState.errors}
          control={formEditar.control}
          setValue={formEditar.setValue}
        />
      </Modal>

      {/* Modal confirmar desactivar */}
      <ModalConfirmar
        abierto={!!estudianteEliminar}
        estudiante={estudianteEliminar}
        onConfirmar={onEliminar}
        onCerrar={() => setEstudianteEliminar(null)}
        cargando={eliminando}
      />

      <ModalCredenciales credenciales={credencialesCreadas} onCerrar={() => setCredencialesCreadas(null)} />
    </div>
  );
};

export default Estudiantes;
