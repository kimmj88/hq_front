// src/@core/composable/useAxios.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    Accept: 'application/json',
  },
});

// Request AccessToken
instance.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  const token = authStore.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error Handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (!error.response) {
      location.href = `${location.origin}/exception`;
    } else if (status === 401) {
      location.href = `${location.origin}/Unauthorized`;
    } else if (status === 409) {
      return Promise.resolve(error.response);
    }

    return Promise.reject(error);
  }
);

export default instance;
