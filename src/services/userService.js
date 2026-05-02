import api from './api';

export const listarUsuariosApi = (params) => api.get('/usuarios', { params });
export const obtenerUsuarioApi = (id) => api.get(`/usuarios/${id}`);
export const crearUsuarioApi = (datos) => api.post('/usuarios', datos);
export const actualizarUsuarioApi = (id, datos) => api.put(`/usuarios/${id}`, datos);
export const cambiarPasswordApi = (id, datos) => api.patch(`/usuarios/${id}/password`, datos);
