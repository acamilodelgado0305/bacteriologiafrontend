import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { listarUsuariosApi, crearUsuarioApi } from '../../services/userService';
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
  const copiar = (texto) => { navigator.clipboard.writeText(texto); toast.success('Copiado'); };
  return (
    <Modal abierto={!!credenciales} onCerrar={onCerrar} titulo="✅ Docente creado exitosamente">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Comparte estas credenciales con el docente supervisor.</p>
        <div className="bg-green-50 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Docente</p>
            <p className="font-semibold text-gray-800">{credenciales?.nombre}</p>
          </div>
          {[
            { label: 'Correo electrónico', value: credenciales?.email },
            { label: 'Contraseña', value: credenciales?.password },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white rounded-lg px-3 py-2 text-sm text-gray-800 border border-green-100 break-all">
                  {value}
                </code>
                <button onClick={() => copiar(value)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0">
                  📋
                </button>
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

const Docentes = () => {
  const [docentes, setDocentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [credencialesCreadas, setCredencialesCreadas] = useState(null);
  const [verPassword, setVerPassword] = useState(false);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm();
  const documento = useWatch({ control, name: 'documento', defaultValue: '' });

  useEffect(() => {
    setValue('password', generarPassword(documento));
  }, [documento, setValue]);

  const cargar = async () => {
    try {
      const { data } = await listarUsuariosApi({ rol: 'docente' });
      setDocentes(data.data);
    } catch {
      toast.error('Error al cargar docentes');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const cerrarModal = () => { setModalAbierto(false); reset(); setVerPassword(false); };

  const onSubmit = async ({ documento: _doc, ...datos }) => {
    setGuardando(true);
    try {
      const { data } = await crearUsuarioApi({ ...datos, rol: 'docente' });
      setDocentes((prev) => [data.data, ...prev]);
      cerrarModal();
      setCredencialesCreadas({
        nombre: `${datos.nombre} ${datos.apellido}`,
        email: datos.email,
        password: datos.password,
      });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear docente');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Docentes supervisores</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión de docentes y sus credenciales de acceso</p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>+ Nuevo docente</Button>
      </div>

      <div className="card p-0 overflow-hidden">
        {cargando ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
          </div>
        ) : docentes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-5xl">👩‍🏫</span>
            <p className="mt-3 text-sm font-medium text-gray-500">No hay docentes registrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Docente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Correo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Último acceso</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {docentes.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{d.nombre} {d.apellido}</td>
                  <td className="px-4 py-3 text-gray-500">{d.email}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {d.ultimoAcceso
                      ? new Date(d.ultimoAcceso).toLocaleDateString('es-CO')
                      : 'Nunca'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={d.activo ? 'badge badge-green' : 'badge badge-gray'}>
                      {d.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal abierto={modalAbierto} onCerrar={cerrarModal} titulo="Registrar nuevo docente">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre *"
              error={errors.nombre?.message}
              {...register('nombre', { required: 'Requerido' })} />
            <Input label="Apellido *"
              error={errors.apellido?.message}
              {...register('apellido', { required: 'Requerido' })} />
          </div>

          <Input
            label="Número de documento"
            {...register('documento')}
          />

          <Input label="Correo electrónico *" type="email"
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
            <p className="text-xs text-gray-400 mt-1">
              Generada a partir del documento. Puedes editarla manualmente.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={guardando} className="flex-1">
              Crear docente
            </Button>
          </div>
        </form>
      </Modal>

      <ModalCredenciales credenciales={credencialesCreadas} onCerrar={() => setCredencialesCreadas(null)} />
    </div>
  );
};

export default Docentes;
