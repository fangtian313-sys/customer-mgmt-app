import apiClient from './client';

export const listActivity = (params) => apiClient.get('/activity/', { params });
