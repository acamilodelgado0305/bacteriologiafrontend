/**
 * ReportePDF.jsx
 * Genera un PDF real (texto seleccionable) usando @react-pdf/renderer.
 * No es una captura de pantalla — el PDF se construye programáticamente.
 */
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import escudo from '../../images/escudounipamplona.png';
import logoBact from '../../images/bact.jpeg';

/* ─── Helpers de fecha (sin toLocaleDateString para máx. compatibilidad en PDF) ─── */
const MESES  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES3 = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIAS   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

const fmtLarga = (iso) => {
  const d = new Date(iso);
  return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
};
const fmtCorta = (iso) => {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MESES3[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/* ─── Paleta de colores ─── */
const C = {
  negro:      '#111827',
  grisOscuro: '#374151',
  gris:       '#6b7280',
  grisClaro:  '#f3f4f6',
  grisBg:     '#f9fafb',
  borde:      '#e5e7eb',
  bordeMedia: '#d1d5db',
  azul:       '#1d4ed8',
  azulBg:     '#eff6ff',
  azulBorde:  '#bfdbfe',
  morado:     '#7c3aed',
  moradoBg:   '#f5f3ff',
  moradoBorde:'#ddd6fe',
  verde:      '#15803d',
  verdeBg:    '#f0fdf4',
  verdeBorde: '#bbf7d0',
  verdeCirc:  '#dcfce7',
  ambar:      '#b45309',
  ambarBg:    '#fffbeb',
  ambarBorde: '#fde68a',
};

/* ─── StyleSheet ─── */
const S = StyleSheet.create({
  /* Página */
  page: {
    paddingTop: 28, paddingBottom: 40,
    paddingHorizontal: 30,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: C.grisOscuro,
    backgroundColor: '#ffffff',
  },

  /* ── Encabezado institucional ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: C.negro,
  },
  logo: { width: 54, height: 64, objectFit: 'contain' },
  headerMid: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  hPais:  { fontSize: 6.5, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  hUniv:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.negro, marginBottom: 1 },
  hFac:   { fontSize: 7.5, color: '#4b5563', marginBottom: 1 },
  hProg:  { fontSize: 7.5, color: '#4b5563', marginBottom: 6 },
  hBox:   { borderWidth: 1.5, borderColor: C.negro, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center' },
  hTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, color: C.negro },
  hSub:   { fontSize: 7.5, color: C.gris, marginTop: 1 },

  /* ── Datos del estudiante ── */
  infoBox: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: C.grisBg,
    borderWidth: 1, borderColor: C.borde, borderRadius: 3,
    padding: 8, marginBottom: 10,
  },
  infoItem: { width: '33.33%', marginBottom: 4 },
  infoLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gris, marginBottom: 1 },
  infoValue: { fontSize: 8, color: C.negro },

  /* ── Tarjetas resumen ── */
  statsRow: { flexDirection: 'row', marginBottom: 10 },
  stat:     { flex: 1, borderRadius: 5, padding: 8, alignItems: 'center', borderWidth: 1 },
  statNum:  { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  statLbl:  { fontSize: 6.5, textAlign: 'center' },

  /* ── Título de sección ── */
  secTit: {
    fontSize: 7.5, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.5,
    color: C.gris, marginTop: 10, marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1, borderBottomColor: C.borde,
  },

  /* ── Tabla general ── */
  tabla:     { borderWidth: 1, borderColor: C.borde, borderRadius: 3, marginBottom: 10 },
  tHead:     { flexDirection: 'row', backgroundColor: C.grisClaro, borderBottomWidth: 1, borderBottomColor: C.bordeMedia, paddingVertical: 5, paddingHorizontal: 6 },
  tHeadCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: C.gris, letterSpacing: 0.3 },
  tRow:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.grisClaro, paddingVertical: 4, paddingHorizontal: 6, alignItems: 'flex-start' },
  tRowPar:   { backgroundColor: C.grisBg },
  tFoot:     { flexDirection: 'row', backgroundColor: C.grisClaro, borderTopWidth: 1.5, borderTopColor: C.bordeMedia, paddingVertical: 5, paddingHorizontal: 6 },
  tCell:     { fontSize: 8, color: C.grisOscuro },
  tBold:     { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.negro },

  /* ── Círculos de firma ── */
  firmaRow: { flexDirection: 'row', justifyContent: 'center' },
  firmaC:   { width: 13, height: 13, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 1 },
  firmaT:   { fontSize: 6.5, fontFamily: 'Helvetica-Bold' },

  /* ── Badge estado ── */
  badge:  { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  badgeT: { fontSize: 6.5, fontFamily: 'Helvetica-Bold' },

  /* ── Número de página (fijo en cada hoja) ── */
  pageNum: {
    position: 'absolute', bottom: 14, left: 0, right: 0,
    textAlign: 'center', fontSize: 7, color: '#9ca3af',
  },
});

/* ════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL DEL PDF
════════════════════════════════════════════════════════════════ */
export default function ReportePDF({ registros, estSeleccionado, periodo, tipoPeriodo }) {
  const totalExamenes = registros.reduce((s, r) => s + (r.examenes || []).reduce((ss, e) => ss + e.cantidad, 0), 0);
  const completados   = registros.filter((r) => r.firmado).length;
  const pendientes    = registros.length - completados;

  /* Resumen por área */
  const areasTotales = {};
  registros.forEach((r) => {
    (r.examenes || []).forEach((e) => {
      const area = e.examen?.area || 'Sin área';
      areasTotales[area] = (areasTotales[area] || 0) + e.cantidad;
    });
  });
  const areasOrdenadas = Object.entries(areasTotales).sort((a, b) => b[1] - a[1]);

  const nombre = `${estSeleccionado?.usuario?.nombre ?? ''} ${estSeleccionado?.usuario?.apellido ?? ''}`.trim();
  const tipoLabels = { semanal: 'Informe Semanal', mensual: 'Informe Mensual', semestral: 'Informe Semestral' };
  const tipoLabel  = tipoLabels[tipoPeriodo] || 'Informe';
  const ahora = new Date();

  return (
    <Document
      title={`Reporte Práctica Formativa - ${nombre}`}
      author="Universidad de Pamplona"
      creator="Sistema de Gestión de Prácticas Formativas"
    >
      <Page size="A4" style={S.page}>

        {/* ══ ENCABEZADO INSTITUCIONAL ══ */}
        <View style={S.header}>
          <Image src={escudo}   style={S.logo} />
          <View style={S.headerMid}>
            <Text style={S.hPais}>República de Colombia</Text>
            <Text style={S.hUniv}>Universidad de Pamplona</Text>
            <Text style={S.hFac}>Facultad de Salud</Text>
            <Text style={S.hProg}>Programa de Bacteriología y Laboratorio Clínico</Text>
            <View style={S.hBox}>
              <Text style={S.hTitle}>Reporte de Práctica Formativa</Text>
              <Text style={S.hSub}>{tipoLabel}</Text>
            </View>
          </View>
          <Image src={logoBact} style={S.logo} />
        </View>

        {/* ══ DATOS DEL ESTUDIANTE ══ */}
        <View style={S.infoBox}>
          {[
            { l: 'Estudiante',      v: nombre || '—' },
            { l: 'Período',         v: periodo.label },
            { l: 'Tipo de informe', v: tipoLabel },
            { l: 'Fecha inicio',    v: fmtCorta(periodo.desde) },
            { l: 'Fecha fin',       v: fmtCorta(periodo.hasta) },
            { l: 'Generado el',     v: fmtCorta(ahora.toISOString()) },
          ].map(({ l, v }) => (
            <View key={l} style={S.infoItem}>
              <Text style={S.infoLabel}>{l}</Text>
              <Text style={S.infoValue}>{v}</Text>
            </View>
          ))}
        </View>

        {/* ══ TARJETAS RESUMEN ══ */}
        <View style={S.statsRow}>
          {[
            { n: registros.length, l: 'Días registrados',   bg: C.azulBg,    borde: C.azulBorde,    col: C.azul    },
            { n: totalExamenes,    l: 'Total exámenes',     bg: C.moradoBg,  borde: C.moradoBorde,  col: C.morado  },
            { n: completados,      l: 'Completados',        bg: C.verdeBg,   borde: C.verdeBorde,   col: C.verde   },
            { n: pendientes,       l: 'Pendientes de firma',bg: C.ambarBg,   borde: C.ambarBorde,   col: C.ambar   },
          ].map(({ n, l, bg, borde, col }, i) => (
            <View key={l} style={[S.stat, { backgroundColor: bg, borderColor: borde, marginRight: i < 3 ? 5 : 0 }]}>
              <Text style={[S.statNum, { color: col }]}>{n}</Text>
              <Text style={[S.statLbl, { color: col }]}>{l}</Text>
            </View>
          ))}
        </View>

        {/* ══ TABLA POR ÁREA ══ */}
        {areasOrdenadas.length > 0 && (
          <>
            <Text style={S.secTit}>Resumen de exámenes por área</Text>
            <View style={S.tabla}>
              {/* Encabezado */}
              <View style={S.tHead}>
                <Text style={[S.tHeadCell, { flex: 1 }]}>Área</Text>
                <Text style={[S.tHeadCell, { width: 60, textAlign: 'right' }]}>Cantidad</Text>
                <Text style={[S.tHeadCell, { width: 45, textAlign: 'right' }]}>%</Text>
              </View>
              {/* Filas */}
              {areasOrdenadas.map(([area, total], i) => (
                <View key={area} style={[S.tRow, i % 2 === 1 ? S.tRowPar : {}]}>
                  <Text style={[S.tCell, { flex: 1 }]}>{area}</Text>
                  <Text style={[S.tBold, { width: 60, textAlign: 'right' }]}>{total}</Text>
                  <Text style={[S.tCell, { width: 45, textAlign: 'right', color: C.gris }]}>
                    {totalExamenes > 0 ? ((total / totalExamenes) * 100).toFixed(1) : '0'}%
                  </Text>
                </View>
              ))}
              {/* Total */}
              <View style={S.tFoot}>
                <Text style={[S.tBold, { flex: 1, fontSize: 7, textTransform: 'uppercase' }]}>TOTAL</Text>
                <Text style={[S.tBold, { width: 60, textAlign: 'right' }]}>{totalExamenes}</Text>
                <Text style={[S.tBold, { width: 45, textAlign: 'right' }]}>100%</Text>
              </View>
            </View>
          </>
        )}

        {/* ══ TABLA DETALLADA DE REGISTROS ══ */}
        <Text style={S.secTit}>
          {`Detalle de registros diarios — ${registros.length} día${registros.length !== 1 ? 's' : ''}`}
        </Text>
        <View style={S.tabla}>
          {/* Encabezado columnas */}
          <View style={S.tHead}>
            <Text style={[S.tHeadCell, { width: 16 }]}>#</Text>
            <Text style={[S.tHeadCell, { width: 88 }]}>Fecha</Text>
            <Text style={[S.tHeadCell, { flex: 1 }]}>Exámenes realizados</Text>
            <Text style={[S.tHeadCell, { width: 30, textAlign: 'center' }]}>Total</Text>
            <Text style={[S.tHeadCell, { width: 40, textAlign: 'center' }]}>E/D/B</Text>
            <Text style={[S.tHeadCell, { width: 58, textAlign: 'center' }]}>Estado</Text>
          </View>

          {/* Filas de registros */}
          {registros.map((r, idx) => {
            const total   = (r.examenes || []).reduce((s, e) => s + e.cantidad, 0);
            const areas   = [...new Set((r.examenes || []).map((e) => e.examen?.area || 'Sin área'))];
            const nFirmas = [r.firmaEstudiante, r.firmaDocente, r.firmaBacteriologo].filter(Boolean).length;

            return (
              <View key={r.id} style={[S.tRow, idx % 2 === 1 ? S.tRowPar : {}]} wrap={false}>
                {/* Número */}
                <Text style={[S.tCell, { width: 16, fontSize: 7, color: '#9ca3af' }]}>{idx + 1}</Text>

                {/* Fecha + horas */}
                <View style={{ width: 88 }}>
                  <Text style={[S.tCell, { fontSize: 7.5, textTransform: 'capitalize' }]}>
                    {fmtLarga(r.fecha)}
                  </Text>
                  {(r.horaEntrada || r.horaSalida) && (
                    <Text style={{ fontSize: 6.5, color: '#9ca3af', marginTop: 1 }}>
                      {[
                        r.horaEntrada ? `Entrada: ${r.horaEntrada}` : '',
                        r.horaSalida  ? `Salida: ${r.horaSalida}`   : '',
                      ].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </View>

                {/* Exámenes por área */}
                <View style={{ flex: 1 }}>
                  {areas.map((area) => {
                    const exsArea   = (r.examenes || []).filter((e) => (e.examen?.area || 'Sin área') === area);
                    const totalArea = exsArea.reduce((s, e) => s + e.cantidad, 0);
                    return (
                      <Text key={area} style={{ fontSize: 7.5, color: C.grisOscuro, marginBottom: 1.5 }}>
                        <Text style={{ fontFamily: 'Helvetica-Bold', color: C.gris }}>{area}: </Text>
                        {exsArea.map((e) => `${e.examen?.nombre} (${e.cantidad})`).join(', ')}
                        <Text style={{ color: '#9ca3af' }}> = {totalArea}</Text>
                      </Text>
                    );
                  })}
                  {r.observaciones && (
                    <Text style={{ fontSize: 7, color: C.ambar, marginTop: 1, fontFamily: 'Helvetica-Oblique' }}>
                      {'Obs: ' + r.observaciones}
                    </Text>
                  )}
                </View>

                {/* Total */}
                <Text style={[S.tBold, { width: 30, textAlign: 'center' }]}>{total}</Text>

                {/* Círculos E / D / B */}
                <View style={[S.firmaRow, { width: 40 }]}>
                  {[
                    { l: 'E', a: !!r.firmaEstudiante },
                    { l: 'D', a: !!r.firmaDocente },
                    { l: 'B', a: !!r.firmaBacteriologo },
                  ].map(({ l, a }) => (
                    <View key={l} style={[S.firmaC, {
                      backgroundColor: a ? C.verdeCirc : C.grisBg,
                      borderColor:     a ? '#86efac'   : C.borde,
                    }]}>
                      <Text style={[S.firmaT, { color: a ? C.verde : '#9ca3af' }]}>{l}</Text>
                    </View>
                  ))}
                </View>

                {/* Badge estado */}
                <View style={{ width: 58, alignItems: 'center' }}>
                  <View style={[S.badge, {
                    backgroundColor: r.firmado ? C.verdeCirc : C.grisClaro,
                  }]}>
                    <Text style={[S.badgeT, { color: r.firmado ? C.verde : C.gris }]}>
                      {r.firmado ? 'Completado' : `Pend. (${nFirmas}/3)`}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Fila de totales */}
          <View style={S.tFoot}>
            <Text style={{ width: 16 }} />
            <Text style={[S.tBold, { width: 88, fontSize: 7, textTransform: 'uppercase' }]}>Totales del período</Text>
            <Text style={{ flex: 1 }} />
            <Text style={[S.tBold, { width: 30, textAlign: 'center' }]}>{totalExamenes}</Text>
            <Text style={{ width: 40 }} />
            <Text style={[S.tCell, { width: 58, textAlign: 'center', fontSize: 7 }]}>
              {completados}/{registros.length} completados
            </Text>
          </View>
        </View>

        {/* ══ PIE DE PÁGINA (se repite en cada hoja) ══ */}
        <Text
          style={S.pageNum}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Sistema de Gestión de Prácticas Formativas · Universidad de Pamplona    |    Página ${pageNumber} de ${totalPages}`
          }
        />

      </Page>
    </Document>
  );
}
