// src/shared/services/httpClient.ts
import axios, { type AxiosError } from 'axios';

// API base URL - Vite environment variable'dan al
// Eğer VITE_API_BASE_URL ayarlanmışsa onu kullan, yoksa relative path kullan (nginx proxy için)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL 
  : (import.meta.env.PROD ? '/api' : 'http://localhost:3000');

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Authorization header ve FormData desteği
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // FormData gönderirken Content-Type header'ını kaldır
  // Axios otomatik olarak multipart/form-data ve boundary'yi ayarlayacak
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Response interceptor: 401 ise logout / yönlendirme
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token geçersiz veya süresi dolmuş
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Sadece login sayfasında değilsek yönlendir
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default httpClient;
