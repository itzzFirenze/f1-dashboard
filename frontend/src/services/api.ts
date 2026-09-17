import axios from 'axios';

const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL || '/api',
   timeout: 15000,
   headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for error handling
api.interceptors.response.use(
   (response) => response,
   (error) => {
      const status = error.response?.status;
      if (import.meta.env.DEV) {
         console.error('API Error:', status, error.response?.data?.message || error.message);
      } else {
         console.error('API request failed with status:', status || 'network error');
      }
      return Promise.reject(error);
   }
);

export default api;