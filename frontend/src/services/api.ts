import axios from 'axios';
import { Band, Vote } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

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
  search: (query: string) => {
    const username = localStorage.getItem('selectedUser');
    return api.get<Band[]>(`/api/bands/search?q=${query}&username=${username}`);
  },
  searchExternal: (query: string) => {
    const username = localStorage.getItem('selectedUser');
    return api.get<any[]>(`/api/bands/search-external?q=${query}&username=${username}`);
  },
  add: (data: { name: string; image: string; spotifyUri?: string; spotifyId?: string; genres?: string[]; username?: string }) =>
    api.post<Band>('/api/bands', { ...data, username: data.username || localStorage.getItem('selectedUser') }),
  getAll: () => api.get<Band[]>('/api/bands'),
  delete: (bandId: string) => {
    const username = localStorage.getItem('selectedUser');
    return api.delete<{ message: string }>(`/api/bands/${bandId}?username=${username}`);
  },
};

export const voteAPI = {
  getAll: () => api.get<Vote[]>('/api/votes'),
  getActive: () => api.get<Vote | null>('/api/votes/active'),
  create: (selectedBands: string[], username?: string) =>
    api.post<Vote>('/api/votes', { selectedBands, username: username || localStorage.getItem('selectedUser') }),
  // submitVote: (voteId: string, bandId: string, username?: string) =>
  //   api.post(`/api/votes/${voteId}/submit`, { bandId, username: username || localStorage.getItem('selectedUser') }),
  submitRating: (voteId: string, score: number, username?: string) =>
    api.post(`/api/votes/${voteId}/rating`, { score, username: username || localStorage.getItem('selectedUser') }),
  getById: (id: string) => api.get<Vote>(`/api/votes/${id}`),
  deleteVote: (id: string) => {
    const username = localStorage.getItem('selectedUser');
    return api.delete(`/api/votes/${id}?username=${username}`);
  },
  submitVoteMultiple: (voteId: string, bandIds: string[], username?: string) =>
    api.post(`/api/votes/${voteId}/submit`, {
      bandIds,
      username: username || localStorage.getItem('selectedUser')
    }),
};


export default api;