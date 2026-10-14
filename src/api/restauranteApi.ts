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

const versions = new Map<string, number>();
function collectVersions(value: unknown) {
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  if ((typeof record.id === 'string' || typeof record.id === 'number') && typeof record.version === 'number' && Number.isInteger(record.version)) versions.set(String(record.id), record.version);
  if (Array.isArray(value)) value.forEach(collectVersions);
  else Object.values(value).forEach(collectVersions);
}
// Interceptores

restauranteApi.interceptors.request.use((config) => {
  const restaurant = useRestaurantStore.getState().restaurant;

  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  };

  if (restaurant) {
    config.headers['x-restaurant-id'] = restaurant.id;
  }

  const path = (config.url || '').replace(/^\//, '');
  if (['post','patch'].includes(config.method || '') && !config.headers['Idempotency-Key']) config.headers['Idempotency-Key'] = crypto.randomUUID();
  if (['patch','delete'].includes(config.method || '') && (path.startsWith('users/') || path.startsWith('restaurant/') || path.startsWith('products/') || path.startsWith('product-options/'))) {
    const id = path.startsWith('restaurant/') ? restaurant?.id : path === 'users/user-role' ? config.data?.userId : path.split('/')[1];
    const version = id ? versions.get(id) : undefined;
    if (config.data instanceof FormData || config.method === 'delete') {
      if (version !== undefined && !config.headers['If-Match']) config.headers['If-Match'] = String(version);
    } else if (version !== undefined) config.data = {...config.data, expectedVersion: config.data?.expectedVersion ?? version};
  }
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

restauranteApi.interceptors.response.use(
  (resp) => { collectVersions(resp.data); return resp; },
  (err) => {
    return Promise.reject(err.response);
  }
);

export default restauranteApi;
