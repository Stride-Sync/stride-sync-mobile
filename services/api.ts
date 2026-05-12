import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const STORAGE_KEY_ACCESS  = '@stridesync:access_token';
const STORAGE_KEY_REFRESH = '@stridesync:refresh_token';

const API_URL = 'https://stride-sync-backend.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 
    'Content-Type': 'application/json',
  },
});

// ── Interceptor de REQUEST — injeta o access token automaticamente ──────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(STORAGE_KEY_ACCESS);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor de RESPONSE — refresh automático em caso de 401 ─────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (t: string) => void; reject: (e: any) => void }> = [];

function processPendingQueue(error: any, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Só tenta refresh se for 401, e não for a própria rota de refresh (evita loop)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/signup')
    ) {
      if (isRefreshing) {
        // Fila de requisições esperando o refresh terminar
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEY_REFRESH);
        if (!refreshToken) throw new Error('Sem refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newAccess  = data.accessToken;
        const newRefresh = data.refreshToken;

        await AsyncStorage.multiSet([
          [STORAGE_KEY_ACCESS,  newAccess],
          [STORAGE_KEY_REFRESH, newRefresh],
        ]);

        processPendingQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processPendingQueue(refreshError, null);
        // Refresh também falhou — limpa tudo e força login
        await AsyncStorage.multiRemove([STORAGE_KEY_ACCESS, STORAGE_KEY_REFRESH]);
        console.warn('[API] Refresh falhou — usuário precisa fazer login novamente.');
        // Importação dinâmica para evitar dependência circular
        const { router } = await import('expo-router');
        router.replace('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Helpers de Token ─────────────────────────────────────────────────────────
export async function saveTokens(accessToken: string, refreshToken: string) {
  await AsyncStorage.multiSet([
    [STORAGE_KEY_ACCESS,  accessToken],
    [STORAGE_KEY_REFRESH, refreshToken],
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY_ACCESS);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([STORAGE_KEY_ACCESS, STORAGE_KEY_REFRESH]);
}

export default api;
