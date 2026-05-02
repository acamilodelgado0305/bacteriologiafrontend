import api from './api';

export const listarEstudiantesApi = (params) => api.get('/estudiantes', { params });
export const obtenerEstudianteApi = (id) => api.get(`/estudiantes/${id}`);
export const crearEstudianteApi = (datos) => api.post('/estudiantes', datos);
export const actualizarEstudianteApi = (id, datos) => api.put(`/estudiantes/${id}`, datos);
export const eliminarEstudianteApi = (id) => api.delete(`/estudiantes/${id}`);
