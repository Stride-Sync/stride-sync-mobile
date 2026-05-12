import api, { saveTokens, clearTokens } from './api';
import { cacheService } from './cache.service';

export interface SignUpPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  birth: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    uuid: string;
    name: string;
    username: string;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async signUp(payload: SignUpPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/signup', payload);
    await saveTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async signIn(payload: SignInPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    await saveTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      await clearTokens();
      try {
        await cacheService.invalidate(); // Limpa todo o cache
      } catch (e) {
        console.error('[AuthService] Erro ao limpar cache no logout:', e);
      }
    }
  },
};
