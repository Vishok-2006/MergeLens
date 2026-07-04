import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({ baseURL: `${API_BASE}/api` });

export const endpoints = {
  dashboard:    () => api.get('/dashboard').then(r => r.data),
  analytics:    () => api.get('/analytics').then(r => r.data),
  status:       () => api.get('/status').then(r => r.data),
  aiStatus:     () => api.get('/ai/status').then(r => r.data),
  repositories: () => api.get('/repositories').then(r => r.data),
  pullRequests: (params?: Record<string, unknown>) => api.get('/pull-requests', { params }).then(r => r.data),
  pullRequest:  (id: string | number) => api.get(`/pull-requests/${id}`).then(r => r.data),
  diff:         (id: string | number) => api.get(`/pull-requests/${id}/diff`).then(r => r.data),
  review:       (id: string | number) => api.post(`/pull-requests/${id}/review`).then(r => r.data),
  search:       (query: string, topK = 8) => api.post('/knowledge/search', { query, topK }).then(r => r.data),
  chat:         (message: string) => api.post('/chat', { message }).then(r => r.data),
};
