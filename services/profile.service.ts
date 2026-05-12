import api from './api';
import { cacheService } from './cache.service';

export interface BiophysicalProfile {
  id: number;
  fitness_level: string;
  focus_goal: string;
  weight_kg: number | null;
  height_cm: number | null;
  weekly_days: number;
  updated_at: string;
}

const FITNESS_LABEL: Record<string, string> = {
  INICIANTE:     'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO:      'Avançado',
  ELITE:         'Elite',
};

const GOAL_LABEL: Record<string, string> = {
  EMAGRECIMENTO:     'Emagrecimento',
  CARDIO:            'Cardio Geral',
  MANUTENCAO:        'Manutenção',
  PREPARACAO_PROVA:  'Preparação para Prova',
};

export const profileService = {
  async get(forceRefresh = false): Promise<BiophysicalProfile | null> {
    const cacheKey = 'profile';
    if (!forceRefresh) {
      const cached = await cacheService.get<BiophysicalProfile>(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data } = await api.get<BiophysicalProfile>('/profile');
      await cacheService.set(cacheKey, data, 30 * 60 * 1000); // 30 min TTL
      return data;
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  },

  fitnessLabel(key: string): string {
    return FITNESS_LABEL[key] ?? key;
  },

  goalLabel(key: string): string {
    return GOAL_LABEL[key] ?? key;
  },
};
