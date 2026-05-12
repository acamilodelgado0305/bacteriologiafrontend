import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { obtenerCierreApi } from '../../services/cierreService';
import Reportes from '../reportes/Reportes';

const ReportesCierre = () => {
  const { id } = useParams();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerCierreApi(id)
      .then(({ data }) => setDatos(data.data))
      .catch(() => toast.error('Error al cargar el cierre'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-up-blue border-t-transparent" />
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Cierre no encontrado</p>
        <Link to="/cierres" className="text-up-blue text-sm mt-2 inline-block">← Volver</Link>
      </div>
    );
  }

  const estudiantesIniciales = datos.estudiantes.map(({ estudiante }) => ({
    id: estudiante.id,
    usuario: estudiante.usuario,
    entidad: estudiante.entidad,
    semestre: estudiante.semestre,
    numeroDocumento: estudiante.numeroDocumento || '',
  }));

  return (
    <Reportes
      cierreId={id}
      cierreNombre={datos.cierre.nombre}
      estudiantesIniciales={estudiantesIniciales}
    />
  );
};

export default ReportesCierre;
