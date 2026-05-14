import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import escudo from '../../images/escudounipamplona.png';
import logoBact from '../../images/bact.jpeg';

const MESES  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES3 = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIAS   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

const fmtLarga = (iso) => {
  const d = new Date(iso);
  return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
};
const fmtCorta = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MESES3[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const C = {
  negro: '#111827', grisOscuro: '#374151', gris: '#6b7280',
  grisClaro: '#f3f4f6', grisBg: '#f9fafb', borde: '#e5e7eb', bordeMedia: '#d1d5db',
  azul: '#1d4ed8', azulBg: '#eff6ff', azulBorde: '#bfdbfe',
  morado: '#7c3aed', moradoBg: '#f5f3ff', moradoBorde: '#ddd6fe',
  verde: '#15803d', verdeBg: '#f0fdf4', verdeBorde: '#bbf7d0',
  indigo: '#3730a3', indigoBg: '#eef2ff', indigoBorde: '#c7d2fe',
};

const S = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 40, paddingHorizontal: 30, fontFamily: 'Helvetica', fontSize: 8.5, color: C.grisOscuro, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: C.negro },
  logo: { width: 54, height: 64, objectFit: 'contain' },
  headerMid: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  hPais:  { fontSize: 6.5, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  hUniv:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.negro, marginBottom: 1 },
  hFac:   { fontSize: 7.5, color: '#4b5563', marginBottom: 1 },
  hProg:  { fontSize: 7.5, color: '#4b5563', marginBottom: 6 },
  hBox:   { borderWidth: 1.5, borderColor: C.negro, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center' },
  hTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, color: C.negro },
  hSub:   { fontSize: 7.5, color: C.gris, marginTop: 1 },
  infoBox: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: C.grisBg, borderWidth: 1, borderColor: C.borde, borderRadius: 3, padding: 8, marginBottom: 10 },
  infoItem: { width: '33.33%', marginBottom: 4 },
  infoLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gris, marginBottom: 1 },
  infoValue: { fontSize: 8, color: C.negro },
  statsRow: { flexDirection: 'row', marginBottom: 10 },
  stat: { flex: 1, borderRadius: 5, padding: 8, alignItems: 'center', borderWidth: 1 },
  statNum: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  statLbl: { fontSize: 6.5, textAlign: 'center' },
  secTit: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, color: C.gris, marginTop: 10, marginBottom: 5, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: C.borde },
  tabla: { borderWidth: 1, borderColor: C.borde, borderRadius: 3, marginBottom: 10 },
  tHead: { flexDirection: 'row', backgroundColor: C.grisClaro, borderBottomWidth: 1, borderBottomColor: C.bordeMedia, paddingVertical: 5, paddingHorizontal: 6 },
  tHeadCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: C.gris, letterSpacing: 0.3 },
  tRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.grisClaro, paddingVertical: 4, paddingHorizontal: 6, alignItems: 'center' },
  tRowPar: { backgroundColor: C.grisBg },
  tFoot: { flexDirection: 'row', backgroundColor: C.grisClaro, borderTopWidth: 1.5, borderTopColor: C.bordeMedia, paddingVertical: 5, paddingHorizontal: 6 },
  tCell: { fontSize: 8, color: C.grisOscuro },
  tBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.negro },
  pageNum: { position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: '#9ca3af' },
});

export default function ReportePDFEntidad({ registros, entidad, periodo, tipoPeriodo }) {
  const totalExamenes = registros.reduce((s, r) => s + (r.examenes || []).reduce((ss, e) => ss + e.cantidad, 0), 0);
  const completados = registros.filter((r) => r.firmado).length;

  const areasTotales = {};
  registros.forEach((r) => {
    (r.examenes || []).forEach((e) => {
      const area = e.examen?.area || 'Sin área';
      areasTotales[area] = (areasTotales[area] || 0) + e.cantidad;
    });
  });
  const areasOrdenadas = Object.entries(areasTotales).sort((a, b) => b[1] - a[1]);

  // Agrupar por estudiante
  const porEstudianteMap = {};
  registros.forEach((r) => {
    const eid = r.estudianteId;
    if (!porEstudianteMap[eid]) {
      porEstudianteMap[eid] = { estudiante: r.estudiante, registros: [], totalExamenes: 0 };
    }
    porEstudianteMap[eid].registros.push(r);
    porEstudianteMap[eid].totalExamenes += (r.examenes || []).reduce((s, e) => s + e.cantidad, 0);
  });
  const estudiantesEntidad = Object.values(porEstudianteMap).sort((a, b) => {
    const na = `${a.estudiante?.usuario?.apellido} ${a.estudiante?.usuario?.nombre}`;
    const nb = `${b.estudiante?.usuario?.apellido} ${b.estudiante?.usuario?.nombre}`;
    return na.localeCompare(nb);
  });

  const tipoLabels = { semanal: 'Informe Semanal', mensual: 'Informe Mensual', semestral: 'Informe Semestral' };
  const tipoLabel = tipoLabels[tipoPeriodo] || 'Informe por Entidad';
  const ahora = new Date();

  return (
    <Document title={`Reporte Entidad - ${entidad?.nombre || ''}`} author="Universidad de Pamplona" creator="Sistema de Gestión de Prácticas Formativas">
      <Page size="A4" style={S.page}>
        {/* Encabezado institucional */}
        <View style={S.header}>
          <Image src={escudo} style={S.logo} />
          <View style={S.headerMid}>
            <Text style={S.hPais}>República de Colombia</Text>
            <Text style={S.hUniv}>Universidad de Pamplona</Text>
            <Text style={S.hFac}>Facultad de Salud</Text>
            <Text style={S.hProg}>Programa de Bacteriología y Laboratorio Clínico</Text>
            <View style={S.hBox}>
              <Text style={S.hTitle}>Reporte por Entidad de Práctica</Text>
              <Text style={S.hSub}>{tipoLabel}</Text>
            </View>
          </View>
          <Image src={logoBact} style={S.logo} />
        </View>

        {/* Datos de la entidad */}
        <View style={S.infoBox}>
          {[
            { l: 'Entidad',         v: entidad?.nombre || '—' },
            { l: 'Ciudad',          v: entidad?.ciudad || '—' },
            { l: 'Departamento',    v: entidad?.departamento || '—' },
            { l: 'Período',         v: periodo.label },
            { l: 'Fecha inicio',    v: fmtCorta(periodo.desde) },
            { l: 'Fecha fin',       v: fmtCorta(periodo.hasta) },
            { l: 'Total estudiantes', v: String(estudiantesEntidad.length) },
            { l: 'Total registros', v: String(registros.length) },
            { l: 'Generado el',     v: fmtCorta(ahora.toISOString()) },
          ].map(({ l, v }) => (
            <View key={l} style={S.infoItem}>
              <Text style={S.infoLabel}>{l}</Text>
              <Text style={S.infoValue}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Tarjetas resumen */}
        <View style={S.statsRow}>
          {[
            { n: estudiantesEntidad.length, l: 'Estudiantes',     bg: C.azulBg,    borde: C.azulBorde,    col: C.azul    },
            { n: registros.length,          l: 'Días registrados', bg: C.indigoBg,  borde: C.indigoBorde,  col: C.indigo  },
            { n: totalExamenes,             l: 'Total exámenes',   bg: C.moradoBg,  borde: C.moradoBorde,  col: C.morado  },
            { n: completados,               l: 'Completados',      bg: C.verdeBg,   borde: C.verdeBorde,   col: C.verde   },
          ].map(({ n, l, bg, borde, col }, i) => (
            <View key={l} style={[S.stat, { backgroundColor: bg, borderColor: borde, marginRight: i < 3 ? 5 : 0 }]}>
              <Text style={[S.statNum, { color: col }]}>{n}</Text>
              <Text style={[S.statLbl, { color: col }]}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Tabla por área */}
        {areasOrdenadas.length > 0 && (
          <>
            <Text style={S.secTit}>Resumen de exámenes por área — entidad completa</Text>
            <View style={S.tabla}>
              <View style={S.tHead}>
                <Text style={[S.tHeadCell, { flex: 1 }]}>Área</Text>
                <Text style={[S.tHeadCell, { width: 60, textAlign: 'right' }]}>Cantidad</Text>
                <Text style={[S.tHeadCell, { width: 45, textAlign: 'right' }]}>%</Text>
              </View>
              {areasOrdenadas.map(([area, total], i) => (
                <View key={area} style={[S.tRow, i % 2 === 1 ? S.tRowPar : {}]}>
                  <Text style={[S.tCell, { flex: 1 }]}>{area}</Text>
                  <Text style={[S.tBold, { width: 60, textAlign: 'right' }]}>{total}</Text>
                  <Text style={[S.tCell, { width: 45, textAlign: 'right', color: C.gris }]}>
                    {totalExamenes > 0 ? ((total / totalExamenes) * 100).toFixed(1) : '0'}%
                  </Text>
                </View>
              ))}
              <View style={S.tFoot}>
                <Text style={[S.tBold, { flex: 1, fontSize: 7, textTransform: 'uppercase' }]}>TOTAL</Text>
                <Text style={[S.tBold, { width: 60, textAlign: 'right' }]}>{totalExamenes}</Text>
                <Text style={[S.tBold, { width: 45, textAlign: 'right' }]}>100%</Text>
              </View>
            </View>
          </>
        )}

        {/* Tabla desglose por estudiante */}
        <Text style={S.secTit}>
          {`Desglose por estudiante — ${estudiantesEntidad.length} estudiante${estudiantesEntidad.length !== 1 ? 's' : ''}`}
        </Text>
        <View style={S.tabla}>
          <View style={S.tHead}>
            <Text style={[S.tHeadCell, { flex: 1 }]}>Estudiante</Text>
            <Text style={[S.tHeadCell, { width: 70 }]}>Documento</Text>
            <Text style={[S.tHeadCell, { width: 45, textAlign: 'center' }]}>Semestre</Text>
            <Text style={[S.tHeadCell, { width: 35, textAlign: 'center' }]}>Días</Text>
            <Text style={[S.tHeadCell, { width: 45, textAlign: 'center' }]}>Exámenes</Text>
            <Text style={[S.tHeadCell, { width: 55, textAlign: 'center' }]}>Completados</Text>
          </View>
          {estudiantesEntidad.map(({ estudiante, registros: regs, totalExamenes: total }, i) => {
            const completadosEst = regs.filter((r) => r.firmado).length;
            const semLabel = estudiante?.semestre === 'noveno' ? 'Noveno' : 'Décimo';
            return (
              <View key={estudiante?.id || i} style={[S.tRow, i % 2 === 1 ? S.tRowPar : {}]} wrap={false}>
                <Text style={[S.tCell, { flex: 1 }]}>
                  {`${estudiante?.usuario?.nombre || ''} ${estudiante?.usuario?.apellido || ''}`}
                </Text>
                <Text style={[S.tCell, { width: 70, fontSize: 7.5 }]}>{estudiante?.numeroDocumento || '—'}</Text>
                <Text style={[S.tCell, { width: 45, textAlign: 'center', fontSize: 7.5 }]}>{semLabel}</Text>
                <Text style={[S.tBold, { width: 35, textAlign: 'center' }]}>{regs.length}</Text>
                <Text style={[S.tBold, { width: 45, textAlign: 'center' }]}>{total}</Text>
                <Text style={[S.tCell, { width: 55, textAlign: 'center', color: C.gris }]}>
                  {`${completadosEst}/${regs.length}`}
                </Text>
              </View>
            );
          })}
          <View style={S.tFoot}>
            <Text style={[S.tBold, { flex: 1, fontSize: 7, textTransform: 'uppercase' }]}>Totales</Text>
            <Text style={[S.tBold, { width: 70 }]} />
            <Text style={[S.tBold, { width: 45 }]} />
            <Text style={[S.tBold, { width: 35, textAlign: 'center' }]}>{registros.length}</Text>
            <Text style={[S.tBold, { width: 45, textAlign: 'center' }]}>{totalExamenes}</Text>
            <Text style={[S.tBold, { width: 55, textAlign: 'center' }]}>{`${completados}/${registros.length}`}</Text>
          </View>
        </View>

        <Text style={S.pageNum} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
