import { useEffect, useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { listarEstudiantesApi } from '../../services/estudianteService';
import { listarRegistrosApi, miHistorialApi } from '../../services/registroService';
import ReportePDF from './ReportePDF';
import escudoUnipamplona from '../../images/escudounipamplona.png';
import logoBact from '../../images/bact.jpeg';

/* ─── Helpers de fechas ─── */
const fmt = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

const fmtCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const periodos = {
  semanal: () => {
    const hoy = new Date();
    const dow = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
    const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - dow);
    const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6);
    return { desde: lunes.toISOString().split('T')[0], hasta: domingo.toISOString().split('T')[0], label: 'Semana actual' };
  },
  mensual: () => {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fin    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return {
      desde: inicio.toISOString().split('T')[0],
      hasta: fin.toISOString().split('T')[0],
      label: inicio.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
    };
  },
  semestral: () => {
    const hoy = new Date(); const mes = hoy.getMonth(); const anio = hoy.getFullYear();
    const inicio = new Date(anio, mes < 6 ? 0 : 6, 1);
    const fin    = new Date(anio, mes < 6 ? 6 : 12, 0);
    return {
      desde: inicio.toISOString().split('T')[0],
      hasta: fin.toISOString().split('T')[0],
      label: `${mes < 6 ? 'I' : 'II'} Semestre ${anio}`,
    };
  },
};

/* ─── Badge estado firmas ─── */
const BadgeEstado = ({ firmado, firmaEstudiante, firmaDocente, firmaBacteriologo }) => {
  if (firmado) return <span className="badge badge-green text-xs">Completado</span>;
  const n = [firmaEstudiante, firmaDocente, firmaBacteriologo].filter(Boolean).length;
  return <span className="badge badge-gray text-xs">Pendiente ({n}/3)</span>;
};

/* ─── Círculo firma ─── */
const Firma = ({ activa, letra, titulo }) => (
  <span
    title={titulo}
    className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold border ${
      activa ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-400 border-gray-200'
    }`}
  >
    {letra}
  </span>
);

/* ════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════════ */
export default function Reportes() {
  const { usuario, esEstudiante } = useAuth();
  const [estudiantes,   setEstudiantes]   = useState([]);
  const [estudianteId,  setEstudianteId]  = useState('');
  const [tipoPeriodo,   setTipoPeriodo]   = useState('mensual');
  const [registros,     setRegistros]     = useState([]);
  const [cargando,      setCargando]      = useState(false);
  const [cargandoEst,   setCargandoEst]   = useState(false);
  const [cargandoPDF,   setCargandoPDF]   = useState(false);
  const [buscado,       setBuscado]       = useState(false);

  const periodo = periodos[tipoPeriodo]();

  /* Cargar lista de estudiantes */
  useEffect(() => {
    if (esEstudiante) return;
    setCargandoEst(true);
    listarEstudiantesApi()
      .then(({ data }) => setEstudiantes(data.data))
      .catch(() => toast.error('Error al cargar estudiantes'))
      .finally(() => setCargandoEst(false));
  }, [esEstudiante]);

  /* Buscar registros */
  const buscar = useCallback(async () => {
    if (!esEstudiante && !estudianteId) { toast.error('Selecciona un estudiante'); return; }
    setCargando(true); setBuscado(true);
    try {
      let data;
      if (esEstudiante) {
        const res = await miHistorialApi();
        const { desde, hasta } = periodo;
        data = res.data.data.filter((r) => { const f = r.fecha.split('T')[0]; return f >= desde && f <= hasta; });
      } else {
        const res = await listarRegistrosApi({ estudianteId, desde: periodo.desde, hasta: periodo.hasta });
        data = res.data.data;
      }
      setRegistros(data);
    } catch { toast.error('Error al generar el reporte'); }
    finally  { setCargando(false); }
  }, [esEstudiante, estudianteId, periodo]);

  useEffect(() => { if (esEstudiante) buscar(); }, [tipoPeriodo, esEstudiante]);

  /* ─── Descargar PDF real ─── */
  const descargarPDF = async () => {
    setCargandoPDF(true);
    try {
      const blob = await pdf(
        <ReportePDF
          registros={registros}
          estSeleccionado={estSeleccionado}
          periodo={periodo}
          tipoPeriodo={tipoPeriodo}
        />
      ).toBlob();

      const url      = URL.createObjectURL(blob);
      const link     = document.createElement('a');
      const filename = [
        'reporte',
        nombreEstudiante.replace(/\s+/g, '-') || 'estudiante',
        tipoPeriodo,
        periodo.desde,
      ].join('-') + '.pdf';

      link.href     = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF descargado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF');
    } finally {
      setCargandoPDF(false);
    }
  };

  /* Cálculos */
  const totalExamenes = registros.reduce((s, r) => s + (r.examenes || []).reduce((ss, e) => ss + e.cantidad, 0), 0);
  const completados   = registros.filter((r) => r.firmado).length;
  const pendientes    = registros.length - completados;

  const areasTotales = {};
  registros.forEach((r) => {
    (r.examenes || []).forEach((e) => {
      const area = e.examen?.area || 'Sin área';
      areasTotales[area] = (areasTotales[area] || 0) + e.cantidad;
    });
  });

  const estSeleccionado = esEstudiante
    ? { usuario: { nombre: usuario?.nombre, apellido: usuario?.apellido } }
    : estudiantes.find((e) => e.id === estudianteId);

  const nombreEstudiante = `${estSeleccionado?.usuario?.nombre ?? ''} ${estSeleccionado?.usuario?.apellido ?? ''}`.trim();
  const tipoLabel = { semanal: 'Informe Semanal', mensual: 'Informe Mensual', semestral: 'Informe Semestral' }[tipoPeriodo];

  /* ── Render ── */
  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Título + botón descargar ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reportes</h2>
          <p className="text-gray-500 text-sm mt-1">Historial de exámenes y firmas — descarga como PDF</p>
        </div>
        {buscado && registros.length > 0 && (
          <button
            onClick={descargarPDF}
            disabled={cargandoPDF}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-up-blue text-white text-sm font-semibold hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {cargandoPDF ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                ⬇️ Descargar PDF
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Filtros ── */}
      <div className="card space-y-4">
        {!esEstudiante && (
          <div>
            <label className="label">Estudiante</label>
            <select
              className="input-field"
              value={estudianteId}
              onChange={(e) => setEstudianteId(e.target.value)}
              disabled={cargandoEst}
            >
              <option value="">Seleccionar estudiante...</option>
              {estudiantes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.usuario.nombre} {e.usuario.apellido} — {e.numeroDocumento}
                  {e.entidad ? ` · ${e.entidad.nombre}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Período del informe</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'semanal',   label: 'Semanal' },
              { key: 'mensual',   label: 'Mensual' },
              { key: 'semestral', label: 'Semestral' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTipoPeriodo(key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  tipoPeriodo === key
                    ? 'bg-up-blue text-white border-up-blue'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {periodo.label} · {fmtCorta(periodo.desde)} — {fmtCorta(periodo.hasta)}
          </p>
        </div>

        {!esEstudiante && (
          <button
            onClick={buscar}
            disabled={!estudianteId || cargando}
            className="w-full py-2.5 bg-up-blue text-white rounded-xl text-sm font-semibold hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cargando ? 'Generando...' : 'Generar reporte'}
          </button>
        )}
      </div>

      {/* ── Estados vacíos / cargando ── */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-up-blue border-t-transparent" />
        </div>
      ) : !buscado ? (
        <div className="card text-center py-16 text-gray-400">
          <span className="text-5xl">📊</span>
          <p className="mt-3 font-medium text-gray-600">Selecciona un estudiante y genera el reporte</p>
          <p className="text-sm mt-1 text-gray-400">El reporte se descargará como PDF directamente</p>
        </div>
      ) : registros.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <span className="text-5xl">📭</span>
          <p className="mt-3 font-medium text-gray-600">Sin registros en este período</p>
          <p className="text-sm mt-1">{periodo.label} · {fmtCorta(periodo.desde)} — {fmtCorta(periodo.hasta)}</p>
        </div>
      ) : (
        /* ── Vista previa del reporte en pantalla ── */
        <div className="space-y-6">

          {/* Encabezado institucional — vista previa */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b-2 border-gray-800 gap-4">
              <img src={escudoUnipamplona} alt="Universidad de Pamplona" className="h-16 object-contain flex-shrink-0" />
              <div className="text-center flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">República de Colombia</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">Universidad de Pamplona</p>
                <p className="text-xs text-gray-500">Facultad de Salud</p>
                <p className="text-xs text-gray-500 mb-2">Programa de Bacteriología y Laboratorio Clínico</p>
                <div className="inline-block border border-gray-800 rounded px-4 py-1">
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-900">Reporte de Práctica Formativa</p>
                  <p className="text-xs text-gray-400 font-medium">{tipoLabel}</p>
                </div>
              </div>
              <img src={logoBact} alt="Bacteriología UP" className="h-16 object-contain rounded flex-shrink-0" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 px-6 py-4 text-sm text-gray-700 bg-gray-50">
              <div><span className="font-semibold">Estudiante: </span>{nombreEstudiante || '—'}</div>
              <div><span className="font-semibold">Período: </span>{periodo.label}</div>
              <div><span className="font-semibold">Tipo: </span>{tipoLabel}</div>
              <div><span className="font-semibold">Desde: </span>{fmtCorta(periodo.desde)}</div>
              <div><span className="font-semibold">Hasta: </span>{fmtCorta(periodo.hasta)}</div>
              <div><span className="font-semibold">Generado: </span>{fmtCorta(new Date().toISOString())}</div>
            </div>
          </div>

          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Días registrados',    valor: registros.length, color: 'bg-blue-50 border-blue-200 text-blue-800' },
              { label: 'Total exámenes',      valor: totalExamenes,    color: 'bg-purple-50 border-purple-200 text-purple-800' },
              { label: 'Completados',         valor: completados,      color: 'bg-green-50 border-green-200 text-green-800' },
              { label: 'Pendientes de firma', valor: pendientes,       color: 'bg-amber-50 border-amber-200 text-amber-800' },
            ].map(({ label, valor, color }) => (
              <div key={label} className={`rounded-xl p-4 border text-center ${color}`}>
                <p className="text-3xl font-extrabold">{valor}</p>
                <p className="text-xs mt-1 font-medium opacity-80">{label}</p>
              </div>
            ))}
          </div>

          {/* Resumen por área */}
          {Object.keys(areasTotales).length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b border-gray-100 pb-2">
                Resumen por área
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Área</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(areasTotales).sort((a, b) => b[1] - a[1]).map(([area, total]) => (
                    <tr key={area}>
                      <td className="px-3 py-2 text-gray-700">{area}</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800">{total}</td>
                      <td className="px-3 py-2 text-right text-gray-500">
                        {totalExamenes > 0 ? ((total / totalExamenes) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                  <tr>
                    <td className="px-3 py-2 font-bold text-xs uppercase text-gray-700">TOTAL</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-800">{totalExamenes}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-800">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Tabla de registros */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                Detalle de registros — {registros.length} día{registros.length !== 1 ? 's' : ''}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Fecha</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Exámenes realizados</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">E/D/B</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registros.map((r, idx) => {
                    const total = (r.examenes || []).reduce((s, e) => s + e.cantidad, 0);
                    const areas = [...new Set((r.examenes || []).map((e) => e.examen?.area || 'Sin área'))];
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap capitalize">
                          {fmt(r.fecha)}
                          {(r.horaEntrada || r.horaSalida) && (
                            <span className="block text-gray-400">
                              {r.horaEntrada && `Entrada: ${r.horaEntrada}`}
                              {r.horaEntrada && r.horaSalida && ' · '}
                              {r.horaSalida && `Salida: ${r.horaSalida}`}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {areas.map((area) => {
                            const exsArea = (r.examenes || []).filter((e) => (e.examen?.area || 'Sin área') === area);
                            const totalArea = exsArea.reduce((s, e) => s + e.cantidad, 0);
                            return (
                              <p key={area} className="text-xs text-gray-600">
                                <span className="font-semibold text-gray-500">{area}: </span>
                                {exsArea.map((e) => `${e.examen?.nombre} (${e.cantidad})`).join(', ')}
                                <span className="ml-1 text-gray-400">= {totalArea}</span>
                              </p>
                            );
                          })}
                          {r.observaciones && (
                            <p className="text-xs text-amber-700 mt-1 italic border-l-2 border-amber-300 pl-1.5">
                              {r.observaciones}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-gray-800">{total}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Firma activa={!!r.firmaEstudiante}   letra="E" titulo="Firma Estudiante" />
                            <Firma activa={!!r.firmaDocente}      letra="D" titulo="Firma Docente" />
                            <Firma activa={!!r.firmaBacteriologo} letra="B" titulo="Firma Bacteriólogo" />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <BadgeEstado
                            firmado={r.firmado}
                            firmaEstudiante={r.firmaEstudiante}
                            firmaDocente={r.firmaDocente}
                            firmaBacteriologo={r.firmaBacteriologo}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-xs font-bold uppercase text-gray-700">Totales</td>
                    <td className="px-3 py-2 text-center font-extrabold text-gray-800">{totalExamenes}</td>
                    <td />
                    <td className="px-3 py-2 text-center text-xs font-semibold text-gray-600">
                      {completados}/{registros.length} completados
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Aviso de descarga */}
          <div className="flex items-center justify-center gap-3 py-3">
            <button
              onClick={descargarPDF}
              disabled={cargandoPDF}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-up-blue text-white font-semibold hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {cargandoPDF ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando PDF...
                </>
              ) : '⬇️ Descargar reporte en PDF'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
