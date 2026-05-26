import api from './api';

export const listarEntidadesApi = (params) => api.get('/entidades', { params });
export const obtenerEntidadApi = (id) => api.get(`/entidades/${id}`);
export const crearEntidadApi = (datos) => api.post('/entidades', datos);
export const actualizarEntidadApi = (id, datos) => api.put(`/entidades/${id}`, datos);
export const eliminarEntidadApi = (id) => api.delete(`/entidades/${id}`);

export const listarExamenesApi = (entidadId) => api.get(`/entidades/${entidadId}/examenes`);
export const crearExamenApi = (entidadId, datos) => api.post(`/entidades/${entidadId}/examenes`, datos);
export const actualizarExamenApi = (entidadId, examenId, datos) =>
  api.put(`/entidades/${entidadId}/examenes/${examenId}`, datos);
export const eliminarExamenApi = (entidadId, examenId) =>
  api.delete(`/entidades/${entidadId}/examenes/${examenId}`);
export const importarExamenesApi = (entidadId, datos) =>
  api.post(`/entidades/${entidadId}/examenes/importar`, datos);

// Personal de la entidad (docentes y bacteriólogos asociados)
export const listarPersonalEntidadApi = (entidadId) => api.get(`/entidades/${entidadId}/personal`);
export const agregarPersonalEntidadApi = (entidadId, usuarioId) =>
  api.post(`/entidades/${entidadId}/personal`, { usuarioId });
export const eliminarPersonalEntidadApi = (entidadId, usuarioId) =>
  api.delete(`/entidades/${entidadId}/personal/${usuarioId}`);
