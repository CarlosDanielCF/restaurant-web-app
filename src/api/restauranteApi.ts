import { useRestaurantStore } from '@/pages/Private/Common/store/restaurantStore';
import axios from 'axios';

import { getEnvVariables } from '../helpers';

const { VITE_API_URL } = getEnvVariables();

const restauranteApi = axios.create({
  baseURL: VITE_API_URL,
  //withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptores

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

restauranteApi.interceptors.request.use((config) => {
  const restaurant = useRestaurantStore.getState().restaurant;

  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  };

  if (restaurant) {
    config.headers['x-restaurant-id'] = restaurant.id;
  }

  const method = (config.method || '').toLowerCase();
  if (['post', 'patch', 'delete', 'put'].includes(method) && !config.headers['Idempotency-Key']) {
    config.headers['Idempotency-Key'] = generateUUID();
  }

  return config;
});

restauranteApi.interceptors.response.use(
  (resp) => resp,
  (err) => {
    return Promise.reject(err.response);
  }
);

export default restauranteApi;
