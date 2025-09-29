import axios from 'axios';
import { Band, Vote, Group } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const selectedUser = localStorage.getItem('selectedUser');
  if (selectedUser) {
    config.headers.username = selectedUser;
  }
  return config;
});

export const bandAPI = {
  search: (query: string) => api.get<Band[]>(`/bands/search?q=${query}`),
  searchExternal: (query: string) =>
    api.get<any[]>(`/bands/search-external?q=${query}`),
  add: (data: { name: string; image: string; spotifyId?: string }) =>
    api.post<Band>('/bands', data),
  getAll: () => api.get<Band[]>('/bands'),
};

export const voteAPI = {
  getAll: () => api.get<Vote[]>('/votes'),
  create: () => api.post<Vote>('/votes'),
  submitVote: (voteId: string, selectedBands: string[]) =>
    api.post(`/votes/${voteId}/submit`, { selectedBands }),
  submitRating: (voteId: string, score: number) =>
    api.post(`/votes/${voteId}/rating`, { score }),
  getById: (id: string) => api.get<Vote>(`/votes/${id}`),
};

export const groupAPI = {
  getAll: () => api.get<Group[]>('/groups'),
  create: (data: { name: string; description?: string }) =>
    api.post<Group>('/groups', data),
  getById: (id: string) => api.get<Group>(`/groups/${id}`),
  delete: (id: string) => api.delete(`/groups/${id}`),
};

export const authAPI = {
  login: (username: string) => api.post('/auth/login', { username }),
  logout: () => api.post('/auth/logout'),
  selectGroup: (userId: string, groupId: string) =>
    api.post('/auth/select-group', { userId, groupId }),
};

export default api;