import api from './api';

export const miPerfilEstudianteApi = () => api.get('/registros/mi-perfil');
export const miHistorialApi = () => api.get('/registros/mi-historial');
export const obtenerPorFechaApi = (fecha) => api.get('/registros/por-fecha', { params: { fecha } });
export const guardarRegistroApi = (datos) => api.post('/registros', datos);
export const listarRegistrosApi = (params) => api.get('/registros', { params });
export const firmarRegistroApi = (id, firma, nombreFirmante, observacionesDocente) =>
  api.post(`/registros/${id}/firmar`, { firma, nombreFirmante, observacionesDocente });
export const pendientesFirmaApi = () => api.get('/registros/pendientes');
export const misSupervisadosApi = () => api.get('/registros/mis-supervisados');
