import api from './api';

export const loginApi = (email, password) =>
  api.post('/auth/login', { email, password });

export const registroApi = (datos) =>
  api.post('/auth/registro', datos);

export const perfilApi = () =>
  api.get('/auth/perfil');

export const refreshTokenApi = (refreshToken) =>
  api.post('/auth/refresh', { refreshToken });
