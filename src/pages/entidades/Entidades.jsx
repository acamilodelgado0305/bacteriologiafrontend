import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { listarEntidadesApi, crearEntidadApi, actualizarEntidadApi, eliminarEntidadApi } from '../../services/entidadService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const FormularioEntidad = ({ register, handleSubmit, errors, onSubmit, guardando, onCerrar, modoEdicion }) => (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    <Input
      label="Nombre de la entidad *"
      error={errors.nombre?.message}
      {...register('nombre', { required: 'Requerido' })}
    />
    <Input label="Dirección" {...register('direccion')} />
    <div className="grid grid-cols-2 gap-3">
      <Input label="Ciudad" {...register('ciudad')} />
      <Input label="Departamento" {...register('departamento')} />
    </div>
    <div className="flex gap-3 pt-2">
      <Button type="button" variant="secondary" className="flex-1" onClick={onCerrar}>
        Cancelar
      </Button>
      <Button type="submit" loading={guardando} className="flex-1">
        {modoEdicion ? 'Guardar cambios' : 'Crear entidad'}
      </Button>
    </div>
  </form>
);

const ModalConfirmar = ({ abierto, entidad, onConfirmar, onCerrar, cargando }) => {
  if (!entidad) return null;
  const tieneEstudiantes = entidad._count.estudiantes > 0;
  const tieneExamenes = entidad._count.examenes > 0;
  const tieneData = tieneEstudiantes || tieneExamenes;
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Eliminar entidad">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          ¿Estás seguro que deseas eliminar{' '}
          <span className="font-semibold text-gray-800">{entidad.nombre}</span>?
          {' '}Esta acción no se puede deshacer.
        </p>
        {tieneData && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
            <p className="text-xs font-semibold text-red-700">Se eliminará o desvinculará lo siguiente:</p>
            {tieneEstudiantes && (
              <p className="text-xs text-red-600">
                • <span className="font-medium">{entidad._count.estudiantes} estudiante{entidad._count.estudiantes !== 1 ? 's' : ''}</span> quedarán desvinculados de esta entidad (sus cuentas y registros diarios se conservan).
              </p>
            )}
            {tieneExamenes && (
              <p className="text-xs text-red-600">
                • <span className="font-medium">{entidad._count.examenes} examen{entidad._count.examenes !== 1 ? 'es' : ''}</span> serán eliminados junto con sus registros en los diarios de práctica.
              </p>
            )}
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {cargando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const FILTROS_SEMESTRE = [
  { value: 'todos', label: 'Todos' },
  { value: 'noveno', label: 'Noveno' },
  { value: 'decimo', label: 'Décimo' },
];

const Entidades = () => {
  const [entidades, setEntidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroSemestre, setFiltroSemestre] = useState('todos');
  const [modalCrear, setModalCrear] = useState(false);
  const [entidadEditar, setEntidadEditar] = useState(null);
  const [entidadEliminar, setEntidadEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const formCrear = useForm();
  const formEditar = useForm();

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

  const abrirEditar = (e, entidad) => {
    e.preventDefault();
    setEntidadEditar(entidad);
    formEditar.reset({
      nombre: entidad.nombre,
      direccion: entidad.direccion || '',
      ciudad: entidad.ciudad || '',
      departamento: entidad.departamento || '',
    });
  };

  const abrirEliminar = (e, entidad) => {
    e.preventDefault();
    setEntidadEliminar(entidad);
  };

  const cerrarCrear = () => { setModalCrear(false); formCrear.reset(); };
  const cerrarEditar = () => { setEntidadEditar(null); formEditar.reset(); };

  const onCrear = async (datos) => {
    setGuardando(true);
    try {
      const { data } = await crearEntidadApi(datos);
      setEntidades((prev) => [{ ...data.data, _count: { estudiantes: 0, examenes: 0 } }, ...prev]);
      toast.success('Entidad creada exitosamente');
      cerrarCrear();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear entidad');
    } finally {
      setGuardando(false);
    }
  };

  const onEditar = async (datos) => {
    setGuardando(true);
    try {
      const { data } = await actualizarEntidadApi(entidadEditar.id, datos);
      setEntidades((prev) => prev.map((e) => e.id === entidadEditar.id ? { ...e, ...data.data } : e));
      toast.success('Entidad actualizada');
      cerrarEditar();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al actualizar');
    } finally {
      setGuardando(false);
    }
  };

  const onEliminar = async () => {
    setEliminando(true);
    try {
      await eliminarEntidadApi(entidadEliminar.id);
      setEntidades((prev) => prev.filter((e) => e.id !== entidadEliminar.id));
      toast.success('Entidad eliminada permanentemente');
      setEntidadEliminar(null);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al eliminar');
    } finally {
      setEliminando(false);
    }
  };

  const entidadesFiltradas = filtroSemestre === 'todos'
    ? entidades
    : entidades.filter((e) => e.semestreActivo === filtroSemestre);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Entidades de Práctica</h2>
          <p className="text-gray-500 text-sm mt-1">Institutos y escenarios donde practican los estudiantes</p>
        </div>
        <Button onClick={() => setModalCrear(true)}>+ Nueva entidad</Button>
      </div>

      {/* Filtro por semestre */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 font-medium">Semestre:</span>
        {FILTROS_SEMESTRE.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFiltroSemestre(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtroSemestre === value
                ? 'bg-up-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
        {filtroSemestre !== 'todos' && (
          <span className="text-xs text-gray-400 ml-1">
            {entidadesFiltradas.length} entidad{entidadesFiltradas.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-up-blue border-t-transparent" />
        </div>
      ) : entidadesFiltradas.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <span className="text-5xl">🏥</span>
          <p className="mt-3 font-medium text-gray-500">
            {filtroSemestre === 'todos' ? 'No hay entidades registradas' : `No hay entidades con estudiantes de ${filtroSemestre} semestre`}
          </p>
          {filtroSemestre === 'todos' && <p className="text-sm mt-1">Crea la primera entidad de práctica</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entidadesFiltradas.map((e) => (
            <div key={e.id} className="card hover:shadow-md transition-shadow border hover:border-blue-200 relative group">
              {/* Botones de acción */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(ev) => abrirEditar(ev, e)}
                  className="p-1.5 text-gray-400 hover:text-up-blue hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(ev) => abrirEliminar(ev, e)}
                  className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <Link to={`/entidades/${e.id}`} className="block">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">🏥</div>
                  <div className="flex items-center gap-2">
                    {e.semestreActivo && (
                      <span className={`badge ${e.semestreActivo === 'noveno' ? 'badge-blue' : 'badge-purple'}`}>
                        {e.semestreActivo === 'noveno' ? '9no' : '10mo'}
                      </span>
                    )}
                    <span className={e.activo ? 'badge badge-green' : 'badge badge-gray'}>
                      {e.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 pr-16">{e.nombre}</h3>
                {e.ciudad && (
                  <p className="text-sm text-gray-500">{e.ciudad}{e.departamento ? `, ${e.departamento}` : ''}</p>
                )}
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span>👨‍🎓 {e._count.estudiantes} estudiantes</span>
                  <span>🧪 {e._count.examenes} exámenes</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear */}
      <Modal abierto={modalCrear} onCerrar={cerrarCrear} titulo="Nueva entidad de práctica">
        <FormularioEntidad
          register={formCrear.register}
          handleSubmit={formCrear.handleSubmit}
          errors={formCrear.formState.errors}
          onSubmit={onCrear}
          guardando={guardando}
          onCerrar={cerrarCrear}
          modoEdicion={false}
        />
      </Modal>

      {/* Modal editar */}
      <Modal abierto={!!entidadEditar} onCerrar={cerrarEditar} titulo="Editar entidad">
        <FormularioEntidad
          register={formEditar.register}
          handleSubmit={formEditar.handleSubmit}
          errors={formEditar.formState.errors}
          onSubmit={onEditar}
          guardando={guardando}
          onCerrar={cerrarEditar}
          modoEdicion={true}
        />
      </Modal>

      {/* Modal confirmar desactivar */}
      <ModalConfirmar
        abierto={!!entidadEliminar}
        entidad={entidadEliminar}
        onConfirmar={onEliminar}
        onCerrar={() => setEntidadEliminar(null)}
        cargando={eliminando}
      />
    </div>
  );
};

export default Entidades;
