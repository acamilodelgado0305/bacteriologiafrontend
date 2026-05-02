import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { listarEntidadesApi, crearEntidadApi } from '../../services/entidadService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const Entidades = () => {
  const [entidades, setEntidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const cargar = async () => {
    try {
      const { data } = await listarEntidadesApi();
      setEntidades(data.data);
    } catch {
      toast.error('Error al cargar entidades');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      const { data } = await crearEntidadApi(datos);
      setEntidades((prev) => [data.data, ...prev]);
      toast.success('Entidad creada exitosamente');
      reset();
      setModalAbierto(false);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear entidad');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Entidades de Práctica</h2>
          <p className="text-gray-500 text-sm mt-1">Institutos y escenarios donde practican los estudiantes</p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>+ Nueva entidad</Button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
        </div>
      ) : entidades.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <span className="text-5xl">🏥</span>
          <p className="mt-3 font-medium text-gray-500">No hay entidades registradas</p>
          <p className="text-sm mt-1">Crea la primera entidad de práctica</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entidades.map((e) => (
            <Link
              key={e.id}
              to={`/entidades/${e.id}`}
              className="card hover:shadow-md transition-shadow border hover:border-blue-200 cursor-pointer block"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">🏥</div>
                <span className={e.activo ? 'badge badge-green' : 'badge badge-gray'}>
                  {e.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{e.nombre}</h3>
              {e.ciudad && (
                <p className="text-sm text-gray-500">{e.ciudad}{e.departamento ? `, ${e.departamento}` : ''}</p>
              )}
              <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span>👨‍🎓 {e._count.estudiantes} estudiantes</span>
                <span>🧪 {e._count.examenes} exámenes</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => { setModalAbierto(false); reset(); }} titulo="Nueva entidad de práctica">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre de la entidad *"
            placeholder="Hospital San Juan de Dios"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'Requerido' })}
          />
          <Input
            label="Dirección"
            placeholder="Calle 5 # 10-20"
            {...register('direccion')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ciudad" placeholder="Pamplona" {...register('ciudad')} />
            <Input label="Departamento" placeholder="Norte de Santander" {...register('departamento')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setModalAbierto(false); reset(); }}>
              Cancelar
            </Button>
            <Button type="submit" loading={guardando} className="flex-1">
              Crear entidad
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Entidades;
