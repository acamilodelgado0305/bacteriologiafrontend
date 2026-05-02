import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { obtenerEntidadApi, crearExamenApi, actualizarExamenApi } from '../../services/entidadService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const AREAS = ['Hematología', 'Inmunología', 'Microbiología', 'Parasitología', 'Química Clínica', 'Uroanálisis', 'Banco de Sangre', 'Otro'];

const EntidadDetalle = () => {
  const { id } = useParams();
  const [entidad, setEntidad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalExamen, setModalExamen] = useState(false);
  const [guardando, setGuardando] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/entidades" className="text-gray-400 hover:text-gray-600 text-sm">← Entidades</Link>
      </div>

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
          <span>👨‍🎓 {entidad._count.estudiantes} estudiantes asignados</span>
          <span>🧪 {entidad.examenes.length} exámenes registrados</span>
        </div>
      </div>

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

      <Modal abierto={modalExamen} onCerrar={() => { setModalExamen(false); reset(); }} titulo="Agregar examen">
        <form onSubmit={handleSubmit(onSubmitExamen)} className="space-y-4">
          <Input
            label="Nombre del examen *"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'Requerido' })}
          />
          <div>
            <label className="label">Área</label>
            <select className="input-field" {...register('area')}>
              <option value="">Seleccionar área</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setModalExamen(false); reset(); }}>
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
