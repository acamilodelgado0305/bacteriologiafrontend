import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });

const Tarjeta = ({ icono, color, valor, label, cargando }) => (
  <div className="card">
    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl ${color} mb-3`}>
      {icono}
    </div>
    {cargando ? (
      <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mb-1" />
    ) : (
      <p className="text-3xl font-bold text-gray-800">{valor ?? '—'}</p>
    )}
    <p className="text-sm text-gray-500 mt-1">{label}</p>
  </div>
);

const ItemActividad = ({ registro, esEstudiante }) => {
  const total = registro.examenes?.reduce((s, e) => s + e.cantidad, 0) || 0;
  const nombre = !esEstudiante
    ? `${registro.estudiante?.usuario?.nombre || ''} ${registro.estudiante?.usuario?.apellido || ''}`
    : null;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${registro.firmado ? 'bg-green-400' : 'bg-amber-400'}`} />
      <div className="flex-1 min-w-0">
        {nombre && <p className="text-sm font-medium text-gray-800 truncate">{nombre}</p>}
        <p className={`text-xs text-gray-500 ${nombre ? '' : 'font-medium text-gray-800'}`}>
          {formatFecha(registro.fecha)}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700">{total}</span>
        <span className="text-xs text-gray-400 ml-1">ex.</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        registro.firmado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {registro.firmado ? 'Completo' : 'Pendiente'}
      </span>
    </div>
  );
};

const Dashboard = () => {
  const { usuario, esEstudiante, esAdmin, esDocente } = useAuth();
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/estadisticas')
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const hoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Bienvenido, {usuario?.nombre} 👋</h2>
        <p className="text-gray-500 text-sm mt-1 capitalize">{hoy}</p>
      </div>

      {/* Tarjetas de estadísticas */}
      {esEstudiante ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Tarjeta icono="🧪" color="bg-blue-50 text-blue-700"   valor={stats?.examenesHoy}       label="Exámenes hoy"        cargando={cargando} />
          <Tarjeta icono="📅" color="bg-green-50 text-green-700" valor={stats?.examenesSemana}    label="Esta semana"         cargando={cargando} />
          <Tarjeta icono="📊" color="bg-purple-50 text-purple-700" valor={stats?.examenesMes}     label="Este mes"            cargando={cargando} />
          <Tarjeta icono="🏥" color="bg-orange-50 text-orange-700" valor={stats?.diasEnPractica}  label="Días en práctica"    cargando={cargando} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Tarjeta icono="👨‍🎓" color="bg-blue-50 text-blue-700"    valor={stats?.totalEstudiantes} label="Estudiantes activos"         cargando={cargando} />
          <Tarjeta icono="✍️"  color="bg-amber-50 text-amber-700"  valor={stats?.pendientesFirma}  label="Pendientes de firma"         cargando={cargando} />
          <Tarjeta icono="✅"  color="bg-green-50 text-green-700"  valor={stats?.firmadosMes}      label="Registros completados (mes)" cargando={cargando} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad reciente */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Actividad reciente</h3>
            {(esAdmin || esDocente) && (
              <Link to="/reportes" className="text-xs text-up-blue hover:underline">Ver reportes →</Link>
            )}
            {esEstudiante && (
              <Link to="/registros" className="text-xs text-up-blue hover:underline">Ir a registro →</Link>
            )}
          </div>
          {cargando ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats?.actividadReciente?.length > 0 ? (
            <div>
              {stats.actividadReciente.map((r) => (
                <ItemActividad key={r.id} registro={r} esEstudiante={esEstudiante} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <span className="text-4xl mb-2">📋</span>
              <p className="text-sm">No hay registros aún</p>
              {esEstudiante && (
                <Link to="/registros" className="mt-2 text-xs text-up-blue hover:underline">
                  Crear primer registro →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">
            {esEstudiante ? 'Mi escenario de práctica' : 'Accesos rápidos'}
          </h3>
          {esEstudiante ? (
            cargando ? (
              <div className="space-y-2">
                {[1,2].map((i) => <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                <Link to="/registros"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-up-blue hover:bg-blue-50 transition-colors group">
                  <span className="text-xl">📋</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-up-blue">Registrar exámenes hoy</p>
                    <p className="text-xs text-gray-400">Llena tu registro diario</p>
                  </div>
                </Link>
                <Link to="/reportes"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-up-blue hover:bg-blue-50 transition-colors group">
                  <span className="text-xl">📊</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-up-blue">Ver mis reportes</p>
                    <p className="text-xs text-gray-400">Resumen semanal, mensual o semestral</p>
                  </div>
                </Link>
              </div>
            )
          ) : (
            <div className="space-y-2">
              {(esAdmin || esDocente) && (
                <Link to="/estudiantes"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-up-blue hover:bg-blue-50 transition-colors group">
                  <span className="text-xl">👨‍🎓</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-up-blue">Gestionar estudiantes</p>
                    <p className="text-xs text-gray-400">{stats?.totalEstudiantes ?? 0} estudiantes activos</p>
                  </div>
                </Link>
              )}
              <Link to="/firmas"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-up-blue hover:bg-blue-50 transition-colors group">
                <span className="text-xl">✍️</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-up-blue">Firmas pendientes</p>
                  <p className="text-xs text-gray-400">
                    {stats?.pendientesFirma ?? 0} registro{stats?.pendientesFirma !== 1 ? 's' : ''} por firmar
                  </p>
                </div>
              </Link>
              <Link to="/reportes"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-up-blue hover:bg-blue-50 transition-colors group">
                <span className="text-xl">📊</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-up-blue">Generar reportes</p>
                  <p className="text-xs text-gray-400">Semanales, mensuales o semestrales</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
