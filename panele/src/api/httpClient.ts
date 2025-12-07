// src/api/httpClient.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Authorization header
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: 401 ise logout / yönlendirme ileride eklenebilir
export default httpClient;
