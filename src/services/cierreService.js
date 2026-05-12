import api from './api';

export const listarCierresApi = () => api.get('/cierres');
export const obtenerCierreApi = (id) => api.get(`/cierres/${id}`);
export const cerrarSemestreApi = (datos) => api.post('/cierres', datos);
export const eliminarCierreApi = (id) => api.delete(`/cierres/${id}`);
