import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

export const summaryAPI = {
  summarizeYouTube: (videoData) => api.post('/summarize/youtube', videoData),
  summarizePDF: (formData) => api.post('/summarize/pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getHistory: (type) => api.get(`/summarize/history${type ? `?type=${type}` : ''}`),
  deleteSummary: (id) => api.delete(`/summarize/${id}`),
};

export default api;