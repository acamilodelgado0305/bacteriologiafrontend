import api from './api';

export const listarEntidadesApi = (params) => api.get('/entidades', { params });
export const obtenerEntidadApi = (id) => api.get(`/entidades/${id}`);
export const crearEntidadApi = (datos) => api.post('/entidades', datos);
export const actualizarEntidadApi = (id, datos) => api.put(`/entidades/${id}`, datos);

export const listarExamenesApi = (entidadId) => api.get(`/entidades/${entidadId}/examenes`);
export const crearExamenApi = (entidadId, datos) => api.post(`/entidades/${entidadId}/examenes`, datos);
export const actualizarExamenApi = (entidadId, examenId, datos) =>
  api.put(`/entidades/${entidadId}/examenes/${examenId}`, datos);
