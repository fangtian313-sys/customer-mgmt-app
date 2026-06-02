import apiClient from './client';

export const listTeams = () => apiClient.get('/teams/');

export const createTeam = (data) => apiClient.post('/teams/', data);

export const getTeam = (id) => apiClient.get(`/teams/${id}`);

export const listMembers = (teamId) => apiClient.get(`/teams/${teamId}/members`);

export const updateMemberRole = (teamId, userId, data) =>
  apiClient.put(`/teams/${teamId}/members/${userId}`, data);

export const removeMember = (teamId, userId) =>
  apiClient.delete(`/teams/${teamId}/members/${userId}`);

export const createInvitation = (data) => apiClient.post('/invitations/', data);

export const getInvitationInfo = (code) => apiClient.get(`/invitations/${code}`);

export const acceptInvitation = (code) => apiClient.post(`/invitations/${code}/accept`);

export const listInvitations = (teamId) => apiClient.get(`/invitations/team/${teamId}`);

export const revokeInvitation = (id) => apiClient.delete(`/invitations/${id}`);
