import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { registroApi } from '../../services/authService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const Registro = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (datos) => {
    setCargando(true);
    try {
      const { confirmar_password, ...payload } = datos;
      await registroApi(payload);
      toast.success('Cuenta creada exitosamente. Inicia sesión.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al crear la cuenta';
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-up-blue to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <span className="text-3xl">🔬</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Bacteriología UP</h1>
          <p className="text-blue-200 text-sm mt-1">Crear cuenta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Registro de usuario</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Andrés"
                error={errors.nombre?.message}
                {...register('nombre', { required: 'Requerido' })}
              />
              <Input
                label="Apellido"
                placeholder="Delgado"
                error={errors.apellido?.message}
                {...register('apellido', { required: 'Requerido' })}
              />
            </div>

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="usuario@unipamplona.edu.co"
              error={errors.email?.message}
              {...register('email', {
                required: 'Requerido',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
              })}
            />

            <div>
              <label className="label">Rol</label>
              <select
                className="input-field"
                {...register('rol', { required: 'Requerido' })}
              >
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente supervisor</option>
              </select>
              {errors.rol && <p className="text-xs text-red-500 mt-1">{errors.rol.message}</p>}
            </div>

            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
              error={errors.password?.message}
              {...register('password', {
                required: 'Requerida',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' },
              })}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repetir contraseña"
              error={errors.confirmar_password?.message}
              {...register('confirmar_password', {
                required: 'Requerida',
                validate: (v) => v === password || 'Las contraseñas no coinciden',
              })}
            />

            <Button type="submit" loading={cargando} className="w-full mt-2">
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-up-blue font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registro;
