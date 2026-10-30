import {
  operationScope,
  pendingOperation,
  confirmOperation,
  PendingOperation
} from './pendingOperation';
import { useRestaurantStore } from '@/pages/Private/Common/store/restaurantStore';
import axios, { AxiosRequestConfig } from 'axios';

import { getEnvVariables } from '../helpers';

const { VITE_API_URL } = getEnvVariables();

const restauranteApi = axios.create({
  baseURL: VITE_API_URL,
  //withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

type LogicalConfig = AxiosRequestConfig & { pendingIntent?: PendingOperation };
const versions = new Map<string, number>();
function collectVersions(value: unknown) {
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  if (
    (typeof record.id === 'string' || typeof record.id === 'number') &&
    typeof record.version === 'number' &&
    Number.isInteger(record.version)
  )
    versions.set(String(record.id), record.version);
  if (Array.isArray(value)) value.forEach(collectVersions);
  else Object.values(value).forEach(collectVersions);
}
// Interceptores

restauranteApi.interceptors.request.use(async (config: LogicalConfig) => {
  const restaurant = useRestaurantStore.getState().restaurant;

  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  };

  if (restaurant) {
    config.headers['x-restaurant-id'] = restaurant.id;
  }

  const path = (config.url || '').replace(/^\//, '');
  if (
    ['post', 'patch', 'put', 'delete'].includes(config.method || '') &&
    !path.startsWith('auth/') &&
    !config.headers['Idempotency-Key']
  ) {
    config.pendingIntent = await pendingOperation(
      operationScope(restaurant?.id),
      `${config.method}:${path}`,
      config.data
    );
    config.headers['Idempotency-Key'] = config.pendingIntent.key;
  }
  if (
    ['patch', 'delete'].includes(config.method || '') &&
    (path.startsWith('users/') ||
      path.startsWith('restaurant/') ||
      path.startsWith('products/') ||
      path.startsWith('product-options/'))
  ) {
    const id = path.startsWith('restaurant/')
      ? restaurant?.id
      : path === 'users/user-role'
        ? config.data?.userId
        : path.split('/')[1];
    const version = id ? versions.get(id) : undefined;
    if (config.data instanceof FormData || config.method === 'delete') {
      if (version !== undefined && !config.headers['If-Match'])
        config.headers['If-Match'] = String(version);
    } else if (version !== undefined)
      config.data = {
        ...config.data,
        expectedVersion: config.data?.expectedVersion ?? version
      };
  }
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

restauranteApi.interceptors.response.use(
  (resp) => {
    const intent = (resp.config as LogicalConfig).pendingIntent;
    if (intent) confirmOperation(intent);
    collectVersions(resp.data);
    return resp;
  },
  (err) => {
    const status = err.response?.status;
    const path = String(err.config?.url || '').replace(/^\//, '');
    if (
      status === 401 &&
      localStorage.getItem('token') &&
      path !== 'auth/login'
    )
      window.dispatchEvent(new Event('session-revoked'));
    return Promise.reject(err.response || err);
  }
);

export default restauranteApi;
