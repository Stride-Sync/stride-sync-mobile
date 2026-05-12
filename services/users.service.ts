import api from './api';
import { AuthResponse } from './auth.service';

export const usersService = {
  async getMe(): Promise<AuthResponse['user']> {
    const { data } = await api.get<AuthResponse['user']>('/users/me');
    return data;
  },
};
