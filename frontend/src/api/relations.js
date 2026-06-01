import apiClient from './client';

export const listRelations = (customerId) =>
  apiClient.get('/relations/', { params: customerId ? { customer_id: customerId } : {} });

export const createRelation = (data) =>
  apiClient.post('/relations/', data);

export const deleteRelation = (id) =>
  apiClient.delete(`/relations/${id}`);
