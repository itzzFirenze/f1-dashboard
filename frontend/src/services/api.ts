import axios from 'axios';

/**
 * Axios instance pre-configured for the F1 Dashboard API.
 * In development, Vite proxy routes /api to localhost:8080.
 * In production, requests go directly to the backend.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api;
