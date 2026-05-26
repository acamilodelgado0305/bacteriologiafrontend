import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { obtenerCierreApi } from '../../services/cierreService';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (iso, opts) => new Date(iso.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO', opts);
const fLarga = (iso) => fmt(iso, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const fCorta = (iso) => fmt(iso, { day: '2-digit', month: 'short', year: 'numeric' });

// ─── reporte (nueva ventana) ─────────────────────────────────────────────────
const abrirReporte = (datos) => {
  const { cierre, estudiantes, supervisores, entidades } = datos;
  const fechaCierre = fmt(cierre.fechaCierre, { day: '2-digit', month: 'long', year: 'numeric' });

  const filasEstudiantes = estudiantes.map(({ estudiante: e, registros, totalExamenes }) => `
    <tr>
      <td>${e.usuario.nombre} ${e.usuario.apellido}</td>
      <td>${e.usuario.email || ''}</td>
      <td>${e.entidad?.nombre || '—'}</td>
      <td>${e.semestre}</td>
      <td style="text-align:center">${registros.length}</td>
      <td style="text-align:center">${totalExamenes}</td>
    </tr>`).join('');

  const filasSupervisores = [
    ...supervisores.docentes.map((d) => `<tr><td>${d.nombre} ${d.apellido}</td><td>Docente</td><td style="text-align:center">${d.totalRegistros}</td><td style="text-align:center">${d.totalEstudiantes}</td></tr>`),
  ].join('');

  const filasEntidades = entidades.map((e) => `
    <tr>
      <td>${e.nombre}</td>
      <td>${e.ciudad || '—'}</td>
      <td style="text-align:center">${e.totalEstudiantes}</td>
      <td style="text-align:center">${e.totalRegistros}</td>
    </tr>`).join('');

  const totalSupervisores = supervisores.docentes.length;

  const html = `<!DOCTYPE html><html lang="es"><head>
  <meta charset="UTF-8"/>
  <title>Reporte: ${cierre.nombre}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#1f2937;padding:24px;font-size:13px}
    h1{font-size:20px;color:#1e3a8a;margin-bottom:4px}
    .meta{color:#6b7280;font-size:12px;margin-bottom:20px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
    .stat{background:#eff6ff;border-radius:8px;padding:12px;text-align:center}
    .stat-num{font-size:22px;font-weight:700;color:#1d4ed8}
    .stat-label{font-size:11px;color:#6b7280;margin-top:2px}
    h2{font-size:14px;font-weight:700;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:20px 0 10px}
    table{width:100%;border-collapse:collapse;margin-bottom:8px}
    th{background:#f9fafb;padding:7px 10px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;text-transform:uppercase;letter-spacing:.5px}
    td{padding:6px 10px;border-bottom:1px solid #f3f4f6;font-size:12px}
    tr:last-child td{border-bottom:none}
    .btn{background:#1d4ed8;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;margin-top:20px}
    @media print{.btn{display:none}body{padding:0}}
  </style>
</head><body>
  <h1>${cierre.nombre}</h1>
  <p class="meta">Cerrado el ${fechaCierre}${cierre.descripcion ? ` · ${cierre.descripcion}` : ''}</p>
  <div class="stats">
    <div class="stat"><div class="stat-num">${cierre.totalEstudiantes}</div><div class="stat-label">Estudiantes</div></div>
    <div class="stat"><div class="stat-num">${cierre.totalRegistros}</div><div class="stat-label">Registros</div></div>
    <div class="stat"><div class="stat-num">${totalSupervisores}</div><div class="stat-label">Supervisores</div></div>
    <div class="stat"><div class="stat-num">${entidades.length}</div><div class="stat-label">Entidades</div></div>
  </div>
  <h2>Estudiantes</h2>
  <table><thead><tr><th>Nombre</th><th>Correo</th><th>Entidad</th><th>Semestre</th><th>Días</th><th>Exámenes</th></tr></thead>
  <tbody>${filasEstudiantes}</tbody></table>
  <h2>Supervisores</h2>
  <table><thead><tr><th>Nombre</th><th>Rol</th><th>Registros supervisados</th><th>Estudiantes</th></tr></thead>
  <tbody>${filasSupervisores}</tbody></table>
  <h2>Entidades de práctica</h2>
  <table><thead><tr><th>Entidad</th><th>Ciudad</th><th>Estudiantes</th><th>Registros</th></tr></thead>
  <tbody>${filasEntidades}</tbody></table>
  <button class="btn" onclick="window.print()">🖨️ Imprimir reporte</button>
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
};

// ─── Registro expandible ─────────────────────────────────────────────────────
const RegistroFila = ({ registro }) => {
  const [expandido, setExpandido] = useState(false);
  const totalExamenes = registro.examenes?.reduce((s, e) => s + e.cantidad, 0) || 0;
  const areas = [...new Set(registro.examenes?.map((e) => e.examen?.area || 'Sin área') || [])].sort();

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-700 capitalize">{fLarga(registro.fecha)}</p>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${registro.firmado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {registro.firmado ? '✅ Completo' : '⏳ Parcial'}
            </span>
          </div>
          {(registro.horaEntrada || registro.horaSalida) && (
            <p className="text-xs text-gray-400 mt-0.5">{registro.horaEntrada} – {registro.horaSalida}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="badge badge-blue">{totalExamenes} exámenes</span>
          <span className={`text-gray-400 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {expandido && (
        <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
          {registro.docenteSupervisor && (
            <div className="bg-blue-50 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-blue-600">Docente supervisor</p>
              <p className="text-sm text-blue-900">{registro.docenteSupervisor.nombre} {registro.docenteSupervisor.apellido}</p>
            </div>
          )}
          {areas.length > 0 && (
            <div className="space-y-2">
              {areas.map((area) => (
                <div key={area}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{area}</p>
                  <div className="space-y-1">
                    {registro.examenes.filter((e) => (e.examen?.area || 'Sin área') === area).map((e) => (
                      <div key={e.id} className="flex justify-between text-sm px-3 py-1.5 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-700">{e.examen?.nombre}</span>
                        <span className="font-semibold text-gray-800">{e.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {registro.observaciones && (
            <div className="bg-amber-50 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-amber-700 mb-0.5">📌 Observaciones del estudiante</p>
              <p className="text-sm text-amber-800">{registro.observaciones}</p>
            </div>
          )}
          {registro.observacionesDocente && (
            <div className="bg-blue-50 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-blue-700 mb-0.5">👩‍🏫 Observaciones del docente</p>
              <p className="text-sm text-blue-800">{registro.observacionesDocente}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {[
              { tiene: !!registro.firmaEstudiante, label: 'Estudiante', fecha: registro.firmaEstudianteFecha },
              { tiene: !!registro.firmaDocente, label: 'Docente', fecha: registro.firmaDocenteFecha },
            ].map(({ tiene, label, fecha }) => (
              <span key={label} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${tiene ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {tiene ? '✓' : '○'} {label}
                {tiene && fecha && <span className="font-normal opacity-70">· {fCorta(fecha)}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab Estudiantes ─────────────────────────────────────────────────────────
const TabEstudiantes = ({ estudiantes }) => {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = estudiantes.filter((item) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    const u = item.estudiante?.usuario;
    return (
      u?.nombre?.toLowerCase().includes(q) ||
      u?.apellido?.toLowerCase().includes(q) ||
      item.estudiante?.entidad?.nombre?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o entidad..."
        className="input-field"
      />
      {filtrados.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">🔍</span>
          <p className="mt-3 font-medium text-gray-700">{busqueda ? 'Sin resultados' : 'No hay estudiantes'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(({ estudiante: est, registros, totalExamenes }) => {
            const [expandido, setExpandido] = useState(false);
            return (
              <div key={est.id} className="card p-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandido((v) => !v)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-up-blue/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">
                      {est.usuario?.nombre} {est.usuario?.apellido}
                    </p>
                    <p className="text-sm text-gray-500">
                      {est.entidad?.nombre || 'Sin entidad'} · {est.semestre}
                    </p>
                    {est.usuario?.email && (
                      <p className="text-xs text-gray-400">{est.usuario.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-800">{registros.length}</p>
                      <p className="text-xs text-gray-400">días</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-800">{totalExamenes}</p>
                      <p className="text-xs text-gray-400">exámenes</p>
                    </div>
                    <span className={`text-gray-400 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                </button>
                {expandido && (
                  <div className="border-t border-gray-100 p-4 space-y-2">
                    {registros.map((r) => <RegistroFila key={r.id} registro={r} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Tab Supervisores ────────────────────────────────────────────────────────
const TabSupervisores = ({ supervisores }) => {
  const { docentes } = supervisores;
  if (docentes.length === 0) {
    return (
      <div className="card text-center py-12">
        <span className="text-4xl">👥</span>
        <p className="mt-3 font-medium text-gray-700">No hay supervisores registrados en este semestre</p>
      </div>
    );
  }

  const Fila = ({ persona, rol, color }) => (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
        <span className="text-base">👤</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800">{persona.nombre} {persona.apellido}</p>
        <p className="text-xs text-gray-400">{rol}</p>
      </div>
      <div className="flex gap-4 text-right flex-shrink-0">
        <div>
          <p className="text-sm font-bold text-gray-800">{persona.totalRegistros}</p>
          <p className="text-xs text-gray-400">registros</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{persona.totalEstudiantes}</p>
          <p className="text-xs text-gray-400">estudiantes</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {docentes.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Docentes · {docentes.length}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {docentes.map((d) => <Fila key={d.id} persona={d} rol="Docente supervisor" color="bg-blue-100" />)}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab Entidades ───────────────────────────────────────────────────────────
const TabEntidades = ({ entidades }) => {
  if (entidades.length === 0) {
    return (
      <div className="card text-center py-12">
        <span className="text-4xl">🏥</span>
        <p className="mt-3 font-medium text-gray-700">No hay entidades registradas en este semestre</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {entidades.map((e) => (
        <div key={e.id} className="card">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">🏥</div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 leading-tight">{e.nombre}</p>
              {(e.ciudad || e.departamento) && (
                <p className="text-xs text-gray-400 mt-0.5">{[e.ciudad, e.departamento].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>
          <div className="flex gap-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span>👨‍🎓 {e.totalEstudiantes} estudiante{e.totalEstudiantes !== 1 ? 's' : ''}</span>
            <span>📋 {e.totalRegistros} registro{e.totalRegistros !== 1 ? 's' : ''}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Tab Resumen ─────────────────────────────────────────────────────────────
const TabResumen = ({ cierre, estudiantes, supervisores, entidades }) => {
  const totalSupervisores = supervisores.docentes.length;
  const totalExamenes = estudiantes.reduce((s, e) => s + e.totalExamenes, 0);

  const stats = [
    { valor: cierre.totalEstudiantes, label: 'Estudiantes', icon: '👨‍🎓', color: 'bg-blue-50 text-blue-700' },
    { valor: cierre.totalRegistros, label: 'Registros diarios', icon: '📋', color: 'bg-green-50 text-green-700' },
    { valor: totalExamenes, label: 'Exámenes realizados', icon: '🧪', color: 'bg-purple-50 text-purple-700' },
    { valor: totalSupervisores, label: 'Supervisores', icon: '👥', color: 'bg-amber-50 text-amber-700' },
    { valor: entidades.length, label: 'Entidades', icon: '🏥', color: 'bg-rose-50 text-rose-700' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(({ valor, label, icon, color }) => (
          <div key={label} className={`card text-center py-5 ${color}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-3xl font-bold">{valor}</p>
            <p className="text-xs mt-1 opacity-70">{label}</p>
          </div>
        ))}
      </div>
      {cierre.descripcion && (
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Descripción</p>
          <p className="text-sm text-gray-700">{cierre.descripcion}</p>
        </div>
      )}
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────
const TABS = [
  { id: 'resumen', label: 'Resumen', icon: '📊' },
  { id: 'estudiantes', label: 'Estudiantes', icon: '👨‍🎓' },
  { id: 'supervisores', label: 'Supervisores', icon: '👥' },
  { id: 'entidades', label: 'Entidades', icon: '🏥' },
];

const CierreDetalle = () => {
  const { id } = useParams();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState('resumen');

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await obtenerCierreApi(id);
        setDatos(data.data);
      } catch {
        toast.error('Error al cargar el cierre');
      } finally {
        setCargando(false);
      }
    };
    cargar();
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

  const { cierre, estudiantes, supervisores, entidades } = datos;

  return (
    <div className="space-y-4">
      {/* Banner Modo Archivo */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-lg">📁</span>
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Modo Archivo</span>
            <span className="text-amber-600 text-xs mx-2">·</span>
            <span className="text-sm font-semibold text-amber-800">{cierre.nombre}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-600">
            Cerrado el {fmt(cierre.fechaCierre, { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <Link
            to={`/cierres/${id}/reportes`}
            className="flex items-center gap-1.5 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            📊 Reportes
          </Link>
          <Link
            to="/cierres"
            className="text-xs text-amber-600 hover:text-amber-800 transition-colors"
          >
            ← Salir
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTabActiva(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tabActiva === tab.id
                  ? 'border-up-blue text-up-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === 'estudiantes' && (
                <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {estudiantes.length}
                </span>
              )}
              {tab.id === 'supervisores' && (
                <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {supervisores.docentes.length}
                </span>
              )}
              {tab.id === 'entidades' && (
                <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {entidades.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido del tab */}
      <div>
        {tabActiva === 'resumen' && (
          <TabResumen cierre={cierre} estudiantes={estudiantes} supervisores={supervisores} entidades={entidades} />
        )}
        {tabActiva === 'estudiantes' && <TabEstudiantes estudiantes={estudiantes} />}
        {tabActiva === 'supervisores' && <TabSupervisores supervisores={supervisores} />}
        {tabActiva === 'entidades' && <TabEntidades entidades={entidades} />}
      </div>
    </div>
  );
};

export default CierreDetalle;
