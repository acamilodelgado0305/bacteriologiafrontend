import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email, password }) => {
    setCargando(true);
    try {
      const usuario = await login(email, password);
      toast.success(`Bienvenido, ${usuario.nombre}`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al iniciar sesión';
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-up-blue to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <span className="text-3xl">🔬</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Bacteriología UP</h1>
          <p className="text-blue-200 text-sm mt-1">Prácticas Formativas</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'El correo es requerido',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
              })}
            />

            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', { required: 'La contraseña es requerida' })}
            />

            <Button type="submit" loading={cargando} className="w-full mt-2">
              Ingresar
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-up-blue font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          Universidad de Pamplona · Programa de Bacteriología y Laboratorio Clínico
        </p>
      </div>
    </div>
  );
};

export default Login;
