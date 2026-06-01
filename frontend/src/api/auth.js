import apiClient from './client';

export const phoneLogin = (phone, name) =>
  apiClient.post('/auth/login', { phone, name });

export const getMe = () => apiClient.get('/auth/me');

export const updateMe = (data) => apiClient.put('/auth/me', data);

export const logout = () => apiClient.post('/auth/logout');
